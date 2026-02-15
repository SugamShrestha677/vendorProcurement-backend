const express = require('express');
const cors = require('cors');
const config = require('./src/config/config');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ExpenseHub API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      requests: '/api/requests',
      invoices: '/api/invoices'
    }
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = config.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
//   console.log(`Environment: ${config.nodeEnv}`);
});














