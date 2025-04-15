const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config({ path: './backend/.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const courses = require('./routes/courses');
const attendance = require('./routes/attendance');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS with more specific configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-login-record'],
  credentials: true
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', auth);
app.use('/api/courses', courses);
app.use('/api/attendance', attendance);

// Error handler middleware
app.use(errorHandler);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 6000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 