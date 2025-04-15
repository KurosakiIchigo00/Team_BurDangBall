const express = require('express');
const {
  recordAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  scanQRCode,
  getStudentAttendance
} = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Add protect middleware to all routes
router.use(protect);

router
  .route('/')
  .post(authorize('lecturer', 'admin'), recordAttendance);

router
  .route('/:id')
  .get(getAttendance)
  .put(authorize('lecturer', 'admin'), updateAttendance)
  .delete(authorize('lecturer', 'admin'), deleteAttendance);

router
  .route('/scan')
  .post(authorize('lecturer', 'admin'), scanQRCode);

// Get student attendance records
router
  .route('/students/:studentId')
  .get(getStudentAttendance);

module.exports = router; 