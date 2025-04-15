const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Record attendance
// @route   POST /api/attendance
// @access  Private/Lecturer
exports.recordAttendance = asyncHandler(async (req, res, next) => {
  const { courseId, studentId, status, date, remarks } = req.body;

  // Validate required fields
  if (!courseId || !studentId) {
    return next(new ErrorResponse('Please provide a course ID and student ID', 400));
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to record attendance for this course`, 401));
  }

  // Check if student exists and is enrolled in the course
  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    return next(new ErrorResponse(`Student not found with id of ${studentId}`, 404));
  }

  if (!course.students.includes(studentId)) {
    return next(new ErrorResponse(`Student is not enrolled in this course`, 400));
  }

  // Format date if provided, otherwise use current date
  let attendanceDate = date ? new Date(date) : new Date();
  
  // Set time to beginning of day to avoid time zone issues
  attendanceDate.setHours(0, 0, 0, 0);

  // Check if attendance record already exists for this date
  let attendance = await Attendance.findOne({
    course: courseId,
    student: studentId,
    date: {
      $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
      $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
    }
  });

  if (attendance) {
    // Update existing attendance record
    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.checkedBy = req.user.id;
    attendance.checkedAt = Date.now();

    await attendance.save();
  } else {
    // Create new attendance record
    attendance = await Attendance.create({
      course: courseId,
      student: studentId,
      date: attendanceDate,
      status: status || 'Present',
      remarks,
      checkedBy: req.user.id
    });
  }

  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Get attendance records for a course
// @route   GET /api/courses/:courseId/attendance
// @access  Private/Lecturer
exports.getCourseAttendance = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { date, studentId } = req.query;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
  }

  // Only course lecturer, enrolled students (their own records), or admin can access
  const isLecturer = course.lecturer.toString() === req.user.id;
  const isEnrolledStudent = course.students.some(student => student.toString() === req.user.id);
  const isAdmin = req.user.role === 'admin';

  if (!isLecturer && !isAdmin && !(isEnrolledStudent && (!studentId || studentId === req.user.id))) {
    return next(new ErrorResponse(`Not authorized to access attendance records`, 401));
  }

  // Build query
  let query = { course: courseId };

  // Filter by specific date if provided
  if (date) {
    const queryDate = new Date(date);
    query.date = {
      $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
      $lt: new Date(queryDate.setHours(23, 59, 59, 999))
    };
  }

  // Filter by specific student if provided
  if (studentId) {
    query.student = studentId;
  } else if (isEnrolledStudent && !isLecturer && !isAdmin) {
    // If student, only show their own records
    query.student = req.user.id;
  }

  // Get attendance records
  const attendance = await Attendance.find(query)
    .populate({
      path: 'student',
      select: 'name email studentId'
    })
    .populate({
      path: 'checkedBy',
      select: 'name email'
    })
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate({
      path: 'student',
      select: 'name email studentId'
    })
    .populate({
      path: 'course',
      select: 'code name'
    })
    .populate({
      path: 'checkedBy',
      select: 'name email'
    });

  if (!attendance) {
    return next(new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404));
  }

  // Check authorization
  const course = await Course.findById(attendance.course);
  
  const isLecturer = course.lecturer.toString() === req.user.id;
  const isStudent = attendance.student._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isLecturer && !isAdmin && !isStudent) {
    return next(new ErrorResponse(`Not authorized to access this attendance record`, 401));
  }

  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Lecturer
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  let attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized (lecturer of the course or admin)
  const course = await Course.findById(attendance.course);
  
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update this attendance record`, 401));
  }

  // Update attendance
  attendance = await Attendance.findByIdAndUpdate(req.params.id, 
    { 
      ...req.body,
      checkedBy: req.user.id,
      checkedAt: Date.now()
    }, 
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Lecturer
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new ErrorResponse(`Attendance record not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized (lecturer of the course or admin)
  const course = await Course.findById(attendance.course);
  
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to delete this attendance record`, 401));
  }

  await attendance.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Scan QR and mark attendance
// @route   POST /api/attendance/scan
// @access  Private/Lecturer
exports.scanQRCode = asyncHandler(async (req, res, next) => {
  const { qrData, courseId, status } = req.body;

  if (!qrData || !courseId) {
    return next(new ErrorResponse('Please provide QR data and course ID', 400));
  }

  // Parse the QR data
  let studentData;
  try {
    studentData = JSON.parse(qrData);
  } catch (err) {
    return next(new ErrorResponse('Invalid QR code format', 400));
  }

  if (!studentData.studentId) {
    return next(new ErrorResponse('Invalid QR code data', 400));
  }

  // Find the student by studentId
  const student = await User.findOne({ studentId: studentData.studentId, role: 'student' });

  if (!student) {
    return next(new ErrorResponse('Student not found with the provided ID', 404));
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to record attendance for this course`, 401));
  }

  // Check if student is enrolled in the course
  if (!course.students.includes(student._id)) {
    return next(new ErrorResponse(`Student is not enrolled in this course`, 400));
  }

  // Check if an attendance record already exists for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({
    course: courseId,
    student: student._id,
    date: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999))
    }
  });

  if (attendance) {
    // Update existing record
    attendance.status = status || attendance.status;
    attendance.checkedBy = req.user.id;
    attendance.checkedAt = Date.now();
    
    await attendance.save();
  } else {
    // Create new attendance record
    attendance = await Attendance.create({
      course: courseId,
      student: student._id,
      status: status || 'Present',
      checkedBy: req.user.id
    });
  }

  res.status(200).json({
    success: true,
    message: `Attendance marked for ${student.name}`,
    data: attendance
  });
});

// @desc    Get student attendance report
// @route   GET /api/students/:studentId/attendance
// @access  Private
exports.getStudentAttendance = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { courseId } = req.query;

  // Check if student exists
  const student = await User.findOne({ 
    _id: studentId, 
    role: 'student' 
  });

  if (!student) {
    return next(new ErrorResponse(`Student not found with id of ${studentId}`, 404));
  }

  // Authorization: only allow the student to see their own records, 
  // or lecturers who have this student in their course, or admin
  const isOwnRecord = req.user.id === studentId;
  const isAdmin = req.user.role === 'admin';
  
  let isLecturer = false;
  if (req.user.role === 'lecturer') {
    // If courseId provided, check if lecturer teaches that course
    if (courseId) {
      const course = await Course.findOne({
        _id: courseId,
        lecturer: req.user.id,
        students: studentId
      });
      isLecturer = !!course;
    } else {
      // Otherwise check if lecturer teaches any course with this student
      const course = await Course.findOne({
        lecturer: req.user.id,
        students: studentId
      });
      isLecturer = !!course;
    }
  }

  if (!isOwnRecord && !isAdmin && !isLecturer) {
    return next(new ErrorResponse(`Not authorized to access this student's attendance`, 401));
  }

  // Build query
  let query = { student: studentId };
  
  if (courseId) {
    query.course = courseId;
  }

  // Get attendance records
  const attendance = await Attendance.find(query)
    .populate({
      path: 'course',
      select: 'code name'
    })
    .populate({
      path: 'checkedBy',
      select: 'name email'
    })
    .sort({ date: -1 });

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    excused: attendance.filter(a => a.status === 'Excused').length
  };

  res.status(200).json({
    success: true,
    stats,
    count: attendance.length,
    data: attendance
  });
}); 