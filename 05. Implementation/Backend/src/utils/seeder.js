const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const connectDB = require('../config/db');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './backend/.env' });

// Connect to database
connectDB();

// Sample user data
const users = [
  {
    name: 'Admin User',
    email: 'admin@attendease.com',
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Demo Lecturer',
    email: 'lecturer@dorsu.edu',
    username: 'lecturer',
    password: 'lecturer123',
    role: 'lecturer'
  },
  {
    name: 'Alex Johnson',
    email: 'student@dorsu.edu',
    username: 'student',
    password: 'student123',
    studentId: 'S10045',
    program: 'Computer Science',
    semester: '3rd Semester',
    role: 'student'
  }
];

// Sample course data
const courses = [
  {
    code: 'CS301',
    name: 'Data Structures',
    description: 'Advanced data structures and algorithms',
    lecturer: '6489d323a1bcb32f9e3c5a72', // This ID will need to be updated after seeding
    schedule: [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101'
      }
    ],
    semester: '1st Semester',
    academicYear: '2023-2024'
  },
  {
    code: 'CS302',
    name: 'Algorithms',
    description: 'Design and analysis of algorithms',
    lecturer: '6489d323a1bcb32f9e3c5a72', // This ID will need to be updated after seeding
    schedule: [
      {
        day: 'Wednesday',
        startTime: '11:00',
        endTime: '12:30',
        room: 'Lab 201'
      }
    ],
    semester: '1st Semester',
    academicYear: '2023-2024'
  },
  {
    code: 'CS303',
    name: 'Database Systems',
    description: 'Principles of database design and management',
    lecturer: '6489d323a1bcb32f9e3c5a72', // This ID will need to be updated after seeding
    schedule: [
      {
        day: 'Friday',
        startTime: '14:00',
        endTime: '15:30',
        room: 'Room 105'
      }
    ],
    semester: '1st Semester',
    academicYear: '2023-2024'
  }
];

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();

    console.log('Data cleared...');

    // Import users
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users imported`);

    // Get lecturer ID for courses
    const lecturer = createdUsers.find(user => user.role === 'lecturer');
    const student = createdUsers.find(user => user.role === 'student');

    // Update course lecturer IDs with actual ID from database
    const coursesWithUpdatedLecturers = courses.map(course => ({
      ...course,
      lecturer: lecturer._id,
      students: [student._id] // Add the student to all courses
    }));

    // Import courses
    await Course.create(coursesWithUpdatedLecturers);
    console.log(`${courses.length} courses imported`);

    console.log('Data imported successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Course.deleteMany();

    console.log('Data destroyed!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line arg to determine action
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please add proper command: -i (import) or -d (delete)');
  process.exit();
} 