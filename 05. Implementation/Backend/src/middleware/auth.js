const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const LoggedIn = require('../models/LoggedIn');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  console.log(`===== PROTECT MIDDLEWARE for ${req.method} ${req.path} =====`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer [hidden]' : 'None',
    hasLoginRecord: !!req.headers['x-login-record']
  });
  
  let token;
  let loginRecordId;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    
    // Check if there's a login record ID in headers (x-login-record)
    if (req.headers['x-login-record']) {
      loginRecordId = req.headers['x-login-record'];
      console.log('Found login record ID in headers:', loginRecordId);
    }
  } else if (req.cookies?.token) {
    // Get token from cookie
    token = req.cookies.token;
    
    // Check if there's a login record ID in cookies
    if (req.cookies['x-login-record']) {
      loginRecordId = req.cookies['x-login-record'];
      console.log('Found login record ID in cookies:', loginRecordId);
    }
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123456789');
    
    // Set user to req.user
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return next(new ErrorResponse('User not found', 401));
    }
    
    // If we have a login record ID, attach it to the request and validate it
    if (loginRecordId) {
      // Clean and validate the login record ID
      try {
        // Ensure it's a valid ObjectId
        const cleanId = loginRecordId.trim();
        req.loginRecordId = cleanId;
        
        // Fetch the login record to verify it exists and belongs to this user
        const loginRecord = await LoggedIn.findById(cleanId);
        
        if (loginRecord) {
          // Verify the login record belongs to the current user
          if (loginRecord.user.toString() === req.user._id.toString()) {
            req.loginRecord = loginRecord;
            console.log(`Login record verified. Status: ${loginRecord.status}, User: ${loginRecord.username}`);
          } else {
            console.log(`Login record ${cleanId} belongs to a different user. Current user: ${req.user._id}, Record user: ${loginRecord.user}`);
            // We still keep the record ID for logout purposes
          }
        } else {
          console.log(`Login record ${cleanId} not found in database`);
        }
      } catch (err) {
        console.error('Error processing login record:', err.message);
        // Don't fail the request because of login record issues
      }
    } else if (req.path.includes('/logout')) {
      // For logout requests without a login record ID, try to find the user's most recent active session
      console.log(`No login record ID provided, but this is a logout request. Looking for active sessions for user ${req.user._id}`);
      
      try {
        const recentActiveSession = await LoggedIn.findOne({
          user: req.user._id,
          status: 'active'
        }).sort({ loginTime: -1 });
        
        if (recentActiveSession) {
          req.loginRecordId = recentActiveSession._id.toString();
          req.loginRecord = recentActiveSession;
          console.log(`Found most recent active session: ${req.loginRecordId}`);
        } else {
          console.log(`No active sessions found for user ${req.user.username}`);
        }
      } catch (err) {
        console.error('Error finding active sessions:', err.message);
      }
    }
    
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
}; 