const mongoose = require('mongoose');

const loggedInSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'admin'],
    required: true
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for calculating session duration
loggedInSchema.virtual('duration').get(function() {
  if (!this.logoutTime) {
    return 'Active';
  }
  
  const durationMs = this.logoutTime - this.loginTime;
  const durationMinutes = Math.floor(durationMs / 60000);
  
  if (durationMinutes < 60) {
    return `${durationMinutes} min${durationMinutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  }
});

module.exports = mongoose.model('LoggedIn', loggedInSchema); 