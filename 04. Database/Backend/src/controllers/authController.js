const User = require('../models/User');
const LoggedIn = require('../models/LoggedIn');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey123456789', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, studentId, program, semester, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password,
    studentId,
    program,
    semester,
    role
  });

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Validate username & password
  if (!username || !password) {
    return next(new ErrorResponse('Please provide a username and password', 400));
  }

  // Check for user
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Get client information for logging
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  let loginRecord;
  
  // First check if user had a session that was ended very recently (within last 30 seconds)
  // This helps prevent creating multiple records when logging in right after logout
  const thirtySecondsAgo = new Date();
  thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);
  
  try {
    const recentlyEndedSession = await LoggedIn.findOne({
      user: user._id,
      status: 'ended',
      logoutTime: { $gte: thirtySecondsAgo },
      device: userAgent,
      ipAddress: ipAddress
    }).sort({ logoutTime: -1 });
    
    if (recentlyEndedSession) {
      console.log(`Found recently ended session (${recentlyEndedSession._id}) from ${recentlyEndedSession.logoutTime} - reactivating it`);
      
      // Reactivate this session instead of creating a new one
      recentlyEndedSession.status = 'active';
      recentlyEndedSession.logoutTime = null;
      recentlyEndedSession.loginTime = new Date(); // Update login time to now
      loginRecord = await recentlyEndedSession.save();
      
      console.log(`Reactivated previous session ID: ${loginRecord._id}`);
    } else {
      console.log(`No recently ended sessions found, checking for other active sessions`);
      
      // Check for any remaining active sessions and end them
      const activeSessions = await LoggedIn.find({
        user: user._id,
        status: 'active'
      });
      
      if (activeSessions.length > 0) {
        console.log(`User ${username} has ${activeSessions.length} active sessions - marking them as ended`);
        
        for (const session of activeSessions) {
          session.status = 'ended';
          session.logoutTime = new Date();
          await session.save();
        }
      }
      
      // Create new login record
      loginRecord = await LoggedIn.create({
        user: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        device: userAgent,
        ipAddress: ipAddress,
        status: 'active',
        loginTime: new Date(),
        logoutTime: null
      });
      
      console.log(`Created new login record ID: ${loginRecord._id}`);
    }
  } catch (err) {
    console.error('Error handling login sessions:', err);
    
    // Fallback: create a new session if something went wrong
    loginRecord = await LoggedIn.create({
      user: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      device: userAgent,
      ipAddress: ipAddress,
      status: 'active',
      loginTime: new Date(),
      logoutTime: null
    });
  }

  console.log(`User ${user.username} logged in successfully. Session ID: ${loginRecord._id}`);

  // Send token response with login record ID
  sendTokenResponse(user, loginRecord._id, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  try {
    console.log('====== LOGOUT REQUEST RECEIVED ======');
    console.log('User info:', {
      id: req.user ? req.user._id : 'Unknown',
      username: req.user ? req.user.username : 'Unknown',
      loginRecordId: req.loginRecordId || 'No login record ID'
    });
    
    const now = new Date();
    let recordsUpdated = 0;
    let updatedRecord = null;
    
    // Only update the specific login record for this session
    if (req.loginRecordId) {
      try {
        const id = new mongoose.Types.ObjectId(req.loginRecordId);
        
        console.log(`Updating login record with ID: ${req.loginRecordId}`);
        console.log(`Setting status to 'ended' and logoutTime to ${now.toISOString()}`);
        
        // Use findByIdAndUpdate to ensure we're doing an atomic update
        updatedRecord = await LoggedIn.findByIdAndUpdate(
          id,
          { 
            status: 'ended', 
            logoutTime: now 
          },
          { new: true } // Return the updated document
        );
        
        if (updatedRecord) {
          recordsUpdated++;
          console.log(`✅ Successfully updated login record ID: ${req.loginRecordId}`);
          console.log('Updated record:', updatedRecord);
        } else {
          console.log(`❌ No record found with ID: ${req.loginRecordId}`);
        }
      } catch (error) {
        console.error('Error updating with login record ID:', error);
      }
    } else if (req.user && req.user._id) {
      // Fallback: If we don't have loginRecordId but have user, update their most recent active session
      try {
        console.log(`No login record ID provided. Trying to update most recent active session for user ${req.user._id}`);
        
        const mostRecentSession = await LoggedIn.findOne({
          user: req.user._id,
          status: 'active'
        }).sort({ loginTime: -1 });
        
        if (mostRecentSession) {
          mostRecentSession.status = 'ended';
          mostRecentSession.logoutTime = now;
          updatedRecord = await mostRecentSession.save();
          
          recordsUpdated++;
          console.log(`✅ Updated most recent session ID: ${mostRecentSession._id}`);
        } else {
          console.log(`⚠️ No active sessions found for user ${req.user.username}`);
        }
      } catch (error) {
        console.error('Error updating most recent session:', error);
      }
    } else {
      console.log('⚠️ No login record ID or user ID provided');
    }
    
    // Verify the update was successful by checking the record directly
    if (updatedRecord && updatedRecord._id) {
      const verifiedRecord = await LoggedIn.findById(updatedRecord._id);
      console.log('Verification check - Record after update:', {
        id: verifiedRecord._id,
        status: verifiedRecord.status,
        logoutTime: verifiedRecord.logoutTime
      });
    }
    
    console.log(`Logout process completed. Records updated: ${recordsUpdated}`);
    console.log('====== LOGOUT REQUEST COMPLETED ======');
    
    // Return response
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {
        logoutTime: now,
        recordsUpdated: recordsUpdated,
        updatedRecord: updatedRecord
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
    next(error);
  }
});

// @desc    Get login history
// @route   GET /api/auth/login-history
// @access  Private/Admin
exports.getLoginHistory = asyncHandler(async (req, res, next) => {
  let query;
  
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  query = LoggedIn.find(JSON.parse(queryStr)).populate({
    path: 'user',
    select: 'name username email role'
  });
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-loginTime');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await LoggedIn.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Executing query
  const loginHistory = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: loginHistory.length,
    pagination,
    data: loginHistory
  });
});

// Helper function to send token response
const sendTokenResponse = (user, loginRecordId, statusCode, res) => {
  // Create token
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  // Remove password from output
  user.password = undefined;

  // Log the login record ID for debugging
  console.log(`Sending login record ID to client: ${loginRecordId}`);

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      loginRecordId: loginRecordId.toString(),
      data: user
    });
}; 