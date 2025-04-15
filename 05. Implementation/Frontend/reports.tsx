import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Appbar, Card, DataTable, Button, Searchbar, Chip, Menu, ProgressBar, Title, Paragraph, Avatar, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/api';

export default function ReportsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState('This Semester');
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Mock data for student information
  const studentInfo = {
    name: 'Albert Einstein',
    id: '2022-2082',
    program: 'Bachelor of Science in Information Technology',
    semester: '3rd Semester'
  };

  // Mock data for course attendance
  const courseAttendance = [
    { id: 1, code: 'CS301', name: 'Data Structures', present: 12, absent: 2, late: 1, totalClasses: 15, attendance: 80 },
    { id: 2, code: 'CS302', name: 'Algorithms', present: 14, absent: 0, late: 1, totalClasses: 15, attendance: 93 },
    { id: 3, code: 'CS303', name: 'Database Systems', present: 10, absent: 3, late: 2, totalClasses: 15, attendance: 67 },
    { id: 4, code: 'CS304', name: 'Web Development', present: 13, absent: 1, late: 1, totalClasses: 15, attendance: 87 },
  ];

  // Student's attendance records
  const attendanceData = [
    { id: 1, course: 'CS301', courseName: 'Data Structures', date: '2023-10-26', time: '09:00 AM', status: 'Present' },
    { id: 2, course: 'CS302', courseName: 'Algorithms', date: '2023-10-26', time: '11:00 AM', status: 'Present' },
    { id: 3, course: 'CS303', courseName: 'Database Systems', date: '2023-10-25', time: '-', status: 'Absent' },
    { id: 4, course: 'CS304', courseName: 'Web Development', date: '2023-10-25', time: '03:30 PM', status: 'Late' },
    { id: 5, course: 'CS301', courseName: 'Data Structures', date: '2023-10-24', time: '09:05 AM', status: 'Present' },
    { id: 6, course: 'CS302', courseName: 'Algorithms', date: '2023-10-24', time: '11:00 AM', status: 'Present' },
    { id: 7, course: 'CS303', courseName: 'Database Systems', date: '2023-10-23', time: '02:00 PM', status: 'Present' },
    { id: 8, course: 'CS304', courseName: 'Web Development', date: '2023-10-23', time: '03:45 PM', status: 'Late' },
  ];

  // Filter data based on search query, selected filter, and course
  const filteredData = attendanceData.filter(item => {
    const matchesSearch = item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
    const matchesCourse = courseFilter === 'All Courses' || item.course === courseFilter;
    return matchesSearch && matchesFilter && matchesCourse;
  });

  // Calculate overall attendance
  const overallAttendance = courseAttendance.reduce((acc, course) => {
    return acc + (course.attendance * course.totalClasses);
  }, 0) / courseAttendance.reduce((acc, course) => acc + course.totalClasses, 0);

  // Calculate items per page and number of pages
  const itemsPerPage = 6;
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const paginatedData = filteredData.slice(from, to);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return '#4CAF50';
      case 'Absent':
        return '#F44336';
      case 'Late':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return '#4CAF50';
    if (percentage >= 75) return '#FF9800';
    return '#F44336';
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      console.log('Student logging out from reports...');
      // Call logout API to update the LoggedIn record status
      const response = await authService.logout();
      console.log('Student logout response:', response);
      
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, navigate to login
      router.replace('/login');
    } finally {
      setLogoutLoading(false);
      setLogoutDialogVisible(false);
    }
  };

  const showLogoutConfirmation = () => {
    setLogoutDialogVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#27548A', '#1E4370', '#153356']}
        style={styles.background}
      />
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Attendance Reports" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="bell" onPress={() => {}} color="#FFF" />
        <Appbar.Action icon="logout" onPress={showLogoutConfirmation} color="#FFF" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* Hero card */}
        <Card style={styles.heroCard}>
          <LinearGradient
            colors={['#27548A', '#1E4370', '#153356']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>Attendance Overview</Text>
                  <Text style={styles.dateRangeText}>{dateRange}</Text>
                </View>
              </View>
              
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentage}>{Math.round(overallAttendance)}%</Text>
                <Text style={styles.progressLabel}>Overall</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attendanceData.filter(a => a.status === 'Present').length}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attendanceData.filter(a => a.status === 'Absent').length}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attendanceData.filter(a => a.status === 'Late').length}</Text>
                  <Text style={styles.statLabel}>Late</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          
          <Card.Content style={styles.attendanceTipContainer}>
            <MaterialCommunityIcons 
              name={overallAttendance >= 85 ? "check-circle" : overallAttendance >= 75 ? "alert-circle" : "alert-octagon"} 
              size={24} 
              color={getAttendanceColor(overallAttendance)} 
            />
            <Text style={[styles.attendanceTip, { color: getAttendanceColor(overallAttendance) }]}>
              {overallAttendance >= 85 
                ? 'Great job! Keep up the good attendance.' 
                : overallAttendance >= 75 
                  ? 'Your attendance is acceptable but could improve.' 
                  : 'Warning: Your attendance is below the required minimum of 75%.'}
            </Text>
          </Card.Content>
        </Card>
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          contentStyle={styles.menuContent}
          anchor={{ x: 0, y: 0 }}
        >
          <Menu.Item 
            onPress={() => {
              setDateRange('This Week');
              setFilterMenuVisible(false);
            }} 
            title="This Week" 
            leadingIcon="calendar-week"
          />
          <Menu.Item 
            onPress={() => {
              setDateRange('This Month');
              setFilterMenuVisible(false);
            }} 
            title="This Month" 
            leadingIcon="calendar-month"
          />
          <Menu.Item 
            onPress={() => {
              setDateRange('This Semester');
              setFilterMenuVisible(false);
            }} 
            title="This Semester" 
            leadingIcon="calendar-text"
          />
        </Menu>
        
        {/* Course attendance card */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Course Attendance" 
            titleStyle={styles.sectionTitle}
            left={(props) => <MaterialCommunityIcons {...props} name="school" size={24} color="#75A420" />}
          />
          <Card.Content style={styles.coursesContent}>
            {courseAttendance.map((course) => (
              <View key={course.id} style={styles.courseItem}>
                <View style={styles.courseHeader}>
                  <View>
                    <Text style={styles.courseCode}>{course.code}</Text>
                    <Text style={styles.courseName}>{course.name}</Text>
                  </View>
                  <Chip 
                    style={[styles.attendanceChip, { backgroundColor: getAttendanceColor(course.attendance) + '20' }]}
                  >
                    <Text style={[styles.coursePercentage, { color: getAttendanceColor(course.attendance) }]}>
                      {course.attendance}%
                    </Text>
                  </Chip>
                </View>
                
                <ProgressBar 
                  progress={course.attendance / 100} 
                  color={getAttendanceColor(course.attendance)} 
                  style={styles.courseProgress} 
                />
                
                <View style={styles.classCountContainer}>
                  <View style={styles.statusIndicators}>
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, {backgroundColor: '#4CAF50'}]} />
                      <Text style={styles.statusText}>{course.present} Present</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, {backgroundColor: '#F44336'}]} />
                      <Text style={styles.statusText}>{course.absent} Absent</Text>
                    </View>
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, {backgroundColor: '#FF9800'}]} />
                      <Text style={styles.statusText}>{course.late} Late</Text>
                    </View>
                  </View>
                  <Text style={styles.totalClassesText}>
                    Total: {course.totalClasses} classes
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
        
        {/* Attendance records table */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Detailed Records" 
            titleStyle={styles.sectionTitle}
            left={(props) => <MaterialCommunityIcons {...props} name="clipboard-text" size={24} color="#75A420" />}
          />
          <Card.Content>
            <Searchbar
              placeholder="Search by course"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              icon="magnify"
              clearIcon="close-circle"
            />
            
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Course:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                <Chip 
                  selected={courseFilter === 'All Courses'} 
                  onPress={() => setCourseFilter('All Courses')}
                  style={styles.filterChip}
                  selectedColor="#75A420"
                >
                  All Courses
                </Chip>
                {courseAttendance.map(course => (
                  <Chip 
                    key={course.code}
                    selected={courseFilter === course.code} 
                    onPress={() => setCourseFilter(course.code)}
                    style={styles.filterChip}
                    selectedColor="#75A420"
                  >
                    {course.code}
                  </Chip>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                <Chip 
                  selected={selectedFilter === 'All'} 
                  onPress={() => setSelectedFilter('All')}
                  style={styles.filterChip}
                  selectedColor="#75A420"
                >
                  All
                </Chip>
                <Chip 
                  selected={selectedFilter === 'Present'} 
                  onPress={() => setSelectedFilter('Present')}
                  style={[styles.filterChip, { backgroundColor: selectedFilter === 'Present' ? '#E8F5E9' : undefined }]}
                  selectedColor="#4CAF50"
                >
                  Present
                </Chip>
                <Chip 
                  selected={selectedFilter === 'Absent'} 
                  onPress={() => setSelectedFilter('Absent')}
                  style={[styles.filterChip, { backgroundColor: selectedFilter === 'Absent' ? '#FFEBEE' : undefined }]}
                  selectedColor="#F44336"
                >
                  Absent
                </Chip>
                <Chip 
                  selected={selectedFilter === 'Late'} 
                  onPress={() => setSelectedFilter('Late')}
                  style={[styles.filterChip, { backgroundColor: selectedFilter === 'Late' ? '#FFF3E0' : undefined }]}
                  selectedColor="#FF9800"
                >
                  Late
                </Chip>
              </ScrollView>
            </View>
            
            <Card style={styles.tableCard}>
              <DataTable>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={styles.tableColumnCourse}>Course</DataTable.Title>
                  <DataTable.Title style={styles.tableColumnDate}>Date</DataTable.Title>
                  <DataTable.Title style={styles.tableColumnTime}>Time</DataTable.Title>
                  <DataTable.Title style={styles.tableColumnStatus}>Status</DataTable.Title>
                </DataTable.Header>
                
                {paginatedData.map((item) => (
                  <DataTable.Row key={item.id} style={styles.tableRow}>
                    <DataTable.Cell style={styles.tableColumnCourse}>{item.course}</DataTable.Cell>
                    <DataTable.Cell style={styles.tableColumnDate}>{item.date}</DataTable.Cell>
                    <DataTable.Cell style={styles.tableColumnTime}>{item.time}</DataTable.Cell>
                    <DataTable.Cell style={styles.tableColumnStatus}>
                      <View style={[styles.statusCell, {backgroundColor: getStatusColor(item.status) + '20'}]}>
                        <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>
                          {item.status}
                        </Text>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
              
              <View style={styles.paginationContainer}>
                <DataTable.Pagination
                  page={page}
                  numberOfPages={Math.ceil(filteredData.length / itemsPerPage)}
                  onPageChange={(page) => setPage(page)}
                  label={`${from + 1}-${to} of ${filteredData.length}`}
                  showFastPaginationControls
                  numberOfItemsPerPage={itemsPerPage}
                />
              </View>
            </Card>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button 
              icon="file-export" 
              mode="contained" 
              style={styles.exportButton}
              labelStyle={styles.buttonLabel}
            >
              Download Report
            </Button>
          </Card.Actions>
        </Card>
        
        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#666" />
          <Text style={styles.noteText}>
            Attendance is marked when your lecturer scans your permanent personal QR code in class.
          </Text>
        </View>
      </ScrollView>
      
      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => !logoutLoading && setLogoutDialogVisible(false)}>
          <Dialog.Title>Confirm Logout</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to log out? Your session will be ended and recorded in the system.</Text>
            {logoutLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size="small" style={styles.loader} />
                <Text>Logging out and updating session record...</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setLogoutDialogVisible(false)} 
              disabled={logoutLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleLogout} 
              disabled={logoutLoading}
              loading={logoutLoading}
            >
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#75A420',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scrollView: {
    padding: 16,
  },
  // Hero card
  heroCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  heroGradient: {
    padding: 20,
  },
  heroContent: {
    width: '100%',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  dateRangeText: {
    color: '#FFFFFFDD',
    fontSize: 14,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressPercentage: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#FFFFFFBB',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#FFFFFFBB',
    fontSize: 12,
  },
  attendanceTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  attendanceTip: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  menuContent: {
    borderRadius: 8,
    marginTop: 8,
  },
  // Section cards
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  coursesContent: {
    padding: 0,
    backgroundColor: '#FFFFFF',
  },
  // Course items
  courseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  attendanceChip: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coursePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  classCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  totalClassesText: {
    fontSize: 12,
    color: '#777',
  },
  // Filters
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  // Search
  searchBar: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  // Table Card
  tableCard: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    marginTop: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableColumnCourse: {
    flex: 2,
  },
  tableColumnDate: {
    flex: 2,
  },
  tableColumnTime: {
    flex: 2,
  },
  tableColumnStatus: {
    flex: 1.5,
    justifyContent: 'center',
  },
  statusCell: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exportButton: {
    backgroundColor: '#27548A',
  },
  buttonLabel: {
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  loader: {
    marginRight: 12,
  },
}); 