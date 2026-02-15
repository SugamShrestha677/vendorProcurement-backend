const Request = require('../models/requestModel');

// @desc    Create new request
// @route   POST /api/requests
// @access  Private/Employee
const createRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      amount,
      currency,
      priority,
      startDate,
      endDate,
      category,
      receiptNumber
    } = req.body;

    const request = await Request.create({
      title,
      description,
      type,
      amount,
      currency,
      priority,
      startDate,
      endDate,
      category,
      receiptNumber,
      requestedBy: req.user.id
    });

    await request.populate('requestedBy', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

// @desc    Get all requests (for managers/admin)
// @route   GET /api/requests
// @access  Private/Manager/Admin
const getAllRequests = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 10, startDate, endDate } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const requests = await Request.find(query)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasMore: skip + requests.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// @desc    Get my requests (for employees)
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    const query = { requestedBy: req.user.id };

    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const requests = await Request.find(query)
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasMore: skip + requests.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your requests',
      error: error.message
    });
  }
};

// @desc    Get pending requests (for managers)
// @route   GET /api/requests/pending
// @access  Private/Manager/Admin
const getPendingRequests = async (req, res) => {
  try {
    const { type, priority, page = 1, limit = 10 } = req.query;

    const query = { status: 'pending' };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const requests = await Request.find(query)
      .populate('requestedBy', 'name email department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasMore: skip + requests.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .populate('comments.user', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user has permission to view this request
    const isOwner = request.requestedBy._id.toString() === req.user.id;
    const isManagerOrAdmin = ['manager', 'admin'].includes(req.user.role);

    if (!isOwner && !isManagerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
};

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private/Owner
const updateRequest = async (req, res) => {
  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Only owner can update and only if pending
    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update request that is not pending'
      });
    }

    const { title, description, type, amount, priority, startDate, endDate, category } = req.body;

    request = await Request.findByIdAndUpdate(
      req.params.id,
      { title, description, type, amount, priority, startDate, endDate, category },
      { new: true, runValidators: true }
    ).populate('requestedBy', 'name email department');

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request',
      error: error.message
    });
  }
};

// @desc    Approve request
// @route   PUT /api/requests/:id/approve
// @access  Private/Manager/Admin
const approveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvalDate = Date.now();

    await request.save();
    await request.populate('requestedBy', 'name email department');
    await request.populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Request approved successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving request',
      error: error.message
    });
  }
};

// @desc    Reject request
// @route   PUT /api/requests/:id/reject
// @access  Private/Manager/Admin
const rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending'
      });
    }

    request.status = 'rejected';
    request.approvedBy = req.user.id;
    request.approvalDate = Date.now();
    request.rejectionReason = rejectionReason || 'No reason provided';

    await request.save();
    await request.populate('requestedBy', 'name email department');
    await request.populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Request rejected',
      data: { request }
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting request',
      error: error.message
    });
  }
};

// @desc    Cancel request
// @route   PUT /api/requests/:id/cancel
// @access  Private/Owner
const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling request',
      error: error.message
    });
  }
};

// @desc    Add comment to request
// @route   POST /api/requests/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.comments.push({
      user: req.user.id,
      text
    });

    await request.save();
    await request.populate('comments.user', 'name email');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: { comments: request.comments }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Private
const getRequestStats = async (req, res) => {
  try {
    let matchQuery = {};

    // If employee, only show their stats
    if (req.user.role === 'employee') {
      matchQuery.requestedBy = req.user._id;
    }

    const statusStats = await Request.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const typeStats = await Request.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalRequests = await Request.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        totalRequests,
        byStatus: statusStats,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request statistics',
      error: error.message
    });
  }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private/Admin
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting request',
      error: error.message
    });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getPendingRequests,
  getRequestById,
  updateRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  addComment,
  getRequestStats,
  deleteRequest
};
