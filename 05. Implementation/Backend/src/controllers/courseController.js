const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = asyncHandler(async (req, res, next) => {
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
  query = Course.find(JSON.parse(queryStr))
    .populate({
      path: 'lecturer',
      select: 'name email'
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
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Course.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const courses = await query;

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
    count: courses.length,
    pagination,
    data: courses
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate({
      path: 'lecturer',
      select: 'name email'
    })
    .populate({
      path: 'students',
      select: 'name email studentId'
    });

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Lecturer
exports.createCourse = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.lecturer = req.user.id;

  // Check for lecturer
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to create a course`, 401));
  }

  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Lecturer
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Lecturer
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course`, 401));
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Enroll students to course
// @route   PUT /api/courses/:id/enroll
// @access  Private/Lecturer
exports.enrollStudents = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  // Check if students exist
  if (!req.body.students || !Array.isArray(req.body.students)) {
    return next(new ErrorResponse('Please provide an array of student IDs', 400));
  }

  // Validate that all student IDs exist and are student role
  const students = await User.find({
    _id: { $in: req.body.students },
    role: 'student'
  });

  if (students.length !== req.body.students.length) {
    return next(new ErrorResponse('One or more student IDs are invalid', 400));
  }

  // Add students to course
  course.students = [...new Set([...course.students, ...req.body.students])];
  await course.save();

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Remove students from course
// @route   PUT /api/courses/:id/unenroll
// @access  Private/Lecturer
exports.unenrollStudents = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course lecturer or admin
  if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  // Check if students exist
  if (!req.body.students || !Array.isArray(req.body.students)) {
    return next(new ErrorResponse('Please provide an array of student IDs', 400));
  }

  // Remove students from course
  course.students = course.students.filter(
    student => !req.body.students.includes(student.toString())
  );
  
  await course.save();

  res.status(200).json({
    success: true,
    data: course
  });
}); 