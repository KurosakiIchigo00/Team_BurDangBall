const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    default: 'Present'
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    trim: true
  },
  checkedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a student can only have one attendance record per course per day
AttendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema); 