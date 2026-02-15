const Invoice = require('../models/invoiceModel');

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private/Vendor
const createInvoice = async (req, res) => {
  try {
    const {
      title,
      description,
      vendorDetails,
      client,
      items,
      taxRate,
      discount,
      dueDate,
      paymentMethod,
      notes
    } = req.body;

    // Calculate amounts
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * (taxRate || 0)) / 100;
    const totalAmount = subtotal + taxAmount - (discount || 0);

    // Format items with amount
    const formattedItems = items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    }));

    const invoice = await Invoice.create({
      title,
      description,
      vendor: req.user.id,
      vendorDetails,
      client,
      items: formattedItems,
      subtotal,
      taxRate: taxRate || 0,
      taxAmount,
      discount: discount || 0,
      totalAmount,
      dueDate,
      paymentMethod,
      notes
    });

    await invoice.populate('vendor', 'name email');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice }
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// @desc    Get all invoices (for managers/admin)
// @route   GET /api/invoices
// @access  Private/Manager/Admin
const getAllInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, startDate, endDate, vendor } = req.query;

    const query = {};

    if (status) query.status = status;
    if (vendor) query.vendor = vendor;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(query)
      .populate('vendor', 'name email')
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInvoices: total,
          hasMore: skip + invoices.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// @desc    Get my invoices (for vendors)
// @route   GET /api/invoices/my
// @access  Private/Vendor
const getMyInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { vendor: req.user.id };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(query)
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInvoices: total,
          hasMore: skip + invoices.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get my invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your invoices',
      error: error.message
    });
  }
};

// @desc    Get pending invoices (for managers)
// @route   GET /api/invoices/pending
// @access  Private/Manager/Admin
const getPendingInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { status: 'pending' };

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(query)
      .populate('vendor', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: 1 }); // Sort by due date ascending

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInvoices: total,
          hasMore: skip + invoices.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get pending invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invoices',
      error: error.message
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendor', 'name email phone')
      .populate('approvedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permission
    const isOwner = invoice.vendor._id.toString() === req.user.id;
    const isManagerOrAdmin = ['manager', 'admin'].includes(req.user.role);

    if (!isOwner && !isManagerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invoice'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private/Vendor
const updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Only owner can update
    if (invoice.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this invoice'
      });
    }

    // Can only update draft or pending invoices
    if (!['draft', 'pending'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update invoice that is already processed'
      });
    }

    const {
      title,
      description,
      vendorDetails,
      client,
      items,
      taxRate,
      discount,
      dueDate,
      paymentMethod,
      notes
    } = req.body;

    // Recalculate if items changed
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const newTaxRate = taxRate !== undefined ? taxRate : invoice.taxRate;
      const taxAmount = (subtotal * newTaxRate) / 100;
      const newDiscount = discount !== undefined ? discount : invoice.discount;
      const totalAmount = subtotal + taxAmount - newDiscount;

      const formattedItems = items.map(item => ({
        ...item,
        amount: item.quantity * item.unitPrice
      }));

      invoice.items = formattedItems;
      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.totalAmount = totalAmount;
    }

    if (title) invoice.title = title;
    if (description) invoice.description = description;
    if (vendorDetails) invoice.vendorDetails = vendorDetails;
    if (client) invoice.client = client;
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (discount !== undefined) invoice.discount = discount;
    if (dueDate) invoice.dueDate = dueDate;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (notes) invoice.notes = notes;

    await invoice.save();
    await invoice.populate('vendor', 'name email');

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: { invoice }
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

// @desc    Approve invoice
// @route   PUT /api/invoices/:id/approve
// @access  Private/Manager/Admin
const approveInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not pending'
      });
    }

    invoice.status = 'approved';
    invoice.approvedBy = req.user.id;
    invoice.approvalDate = Date.now();

    await invoice.save();
    await invoice.populate('vendor', 'name email');
    await invoice.populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Invoice approved successfully',
      data: { invoice }
    });
  } catch (error) {
    console.error('Approve invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving invoice',
      error: error.message
    });
  }
};

// @desc    Reject invoice
// @route   PUT /api/invoices/:id/reject
// @access  Private/Manager/Admin
const rejectInvoice = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not pending'
      });
    }

    invoice.status = 'rejected';
    invoice.approvedBy = req.user.id;
    invoice.approvalDate = Date.now();
    invoice.rejectionReason = rejectionReason || 'No reason provided';

    await invoice.save();
    await invoice.populate('vendor', 'name email');
    await invoice.populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Invoice rejected',
      data: { invoice }
    });
  } catch (error) {
    console.error('Reject invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting invoice',
      error: error.message
    });
  }
};

// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/pay
// @access  Private/Manager/Admin
const markAsPaid = async (req, res) => {
  try {
    const { paymentReference, paymentMethod } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Invoice must be approved before marking as paid'
      });
    }

    invoice.status = 'paid';
    invoice.paidDate = Date.now();
    if (paymentReference) invoice.paymentReference = paymentReference;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;

    await invoice.save();
    await invoice.populate('vendor', 'name email');

    res.json({
      success: true,
      message: 'Invoice marked as paid',
      data: { invoice }
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking invoice as paid',
      error: error.message
    });
  }
};

// @desc    Cancel invoice
// @route   PUT /api/invoices/:id/cancel
// @access  Private/Vendor
const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this invoice'
      });
    }

    if (!['draft', 'pending'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel draft or pending invoices'
      });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
      data: { invoice }
    });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invoice',
      error: error.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
const getInvoiceStats = async (req, res) => {
  try {
    let matchQuery = {};

    // If vendor, only show their stats
    if (req.user.role === 'vendor') {
      matchQuery.vendor = req.user._id;
    }

    const statusStats = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const monthlyStats = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const totalInvoices = await Invoice.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        totalInvoices,
        byStatus: statusStats,
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice statistics',
      error: error.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.deleteOne();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getMyInvoices,
  getPendingInvoices,
  getInvoiceById,
  updateInvoice,
  approveInvoice,
  rejectInvoice,
  markAsPaid,
  cancelInvoice,
  getInvoiceStats,
  deleteInvoice
};
