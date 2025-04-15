const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudents,
  unenrollStudents
} = require('../controllers/courseController');

const { getCourseAttendance } = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Add protect middleware to all routes
router.use(protect);

router
  .route('/')
  .get(getCourses)
  .post(authorize('lecturer', 'admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(authorize('lecturer', 'admin'), updateCourse)
  .delete(authorize('lecturer', 'admin'), deleteCourse);

router
  .route('/:id/enroll')
  .put(authorize('lecturer', 'admin'), enrollStudents);

router
  .route('/:id/unenroll')
  .put(authorize('lecturer', 'admin'), unenrollStudents);

// Get course attendance
router
  .route('/:courseId/attendance')
  .get(getCourseAttendance);

module.exports = router; 