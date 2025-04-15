import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Appbar, Avatar, Title, Paragraph, List, Chip, ProgressBar, Dialog, Portal, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState({
    name: 'Alex Johnson',
    id: 'S10045',
    course: 'Computer Science',
    semester: '3rd Semester',
  });
  
  const [courses, setCourses] = useState([
    { id: 1, code: 'CS301', name: 'Data Structures', attendance: 85 },
    { id: 2, code: 'CS302', name: 'Algorithms', attendance: 92 },
    { id: 3, code: 'CS303', name: 'Database Systems', attendance: 75 },
    { id: 4, code: 'CS304', name: 'Web Development', attendance: 88 },
  ]);

  // Track which courses are expanded
  const [expandedCourses, setExpandedCourses] = useState<{[key: number]: boolean}>({});

  const toggleCourseExpanded = (courseId: number) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, course: 'CS301 - Data Structures', date: '2023-10-26', time: '09:00 AM', type: 'Attendance', status: 'Present' },
    { id: 2, course: 'CS302 - Algorithms', date: '2023-10-26', time: '11:00 AM', type: 'Assignment', status: 'Submitted' },
    { id: 3, course: 'CS303 - Database Systems', date: '2023-10-25', type: 'Quiz', status: 'Completed' },
    { id: 4, course: 'CS304 - Web Development', date: '2023-10-25', time: '03:30 PM', type: 'Project', status: 'In Progress' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return '#4CAF50';
      case 'Absent':
        return '#F44336';
      case 'Late':
        return '#FF9800';
      case 'Submitted':
        return '#3F51B5';
      case 'Completed':
        return '#9C27B0';
      case 'In Progress':
        return '#00BCD4';
      default:
        return '#757575';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return '#4CAF50';
    if (percentage >= 75) return '#FF9800';
    return '#F44336';
  };

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      console.log('Student logging out...');
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
        colors={['#75A420', '#5A8016', '#456012']}
        style={styles.background}
      />
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Student Dashboard" subtitle="AttendEase" titleStyle={styles.headerTitle} subtitleStyle={styles.headerSubtitle} />
        <Appbar.Action icon="bell" onPress={() => {}} color="#FFF" />
        <Appbar.Action icon="logout" onPress={showLogoutConfirmation} color="#FFF" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* Hero section with student profile */}
        <Card style={styles.heroCard}>
          <LinearGradient
            colors={['#27548A', '#1E4370', '#153356']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={70} 
                label={studentInfo.name.split(' ').map(n => n[0]).join('')} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.studentName}>{studentInfo.name}</Text>
                <Text style={styles.studentId}>ID: {studentInfo.id}</Text>
                <Text style={styles.courseInfo}>{studentInfo.course} • {studentInfo.semester}</Text>
              </View>
            </View>
          </LinearGradient>
          
          <Card.Content style={styles.welcomeContainer}>
            <MaterialCommunityIcons name="hand-wave" size={24} color="#27548A" />
            <Text style={styles.welcomeText}>
              Welcome back! You have upcoming classes today.
            </Text>
          </Card.Content>
        </Card>
        
        {/* Course Attendance */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Course Attendance" 
            left={(props) => <MaterialCommunityIcons {...props} name="school" size={24} color="#75A420" />}
            titleStyle={styles.sectionTitle}
          />
          <Card.Content style={styles.coursesContent}>
            {courses.map((course) => {
              const isExpanded = expandedCourses[course.id] || false;
              
              return (
                <View key={course.id} style={styles.courseFolder}>
                  <TouchableOpacity 
                    style={[
                      styles.courseFolderHeader, 
                      { backgroundColor: getAttendanceColor(course.attendance) + '15' }
                    ]}
                    onPress={() => toggleCourseExpanded(course.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.courseFolderLeft}>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "folder-open" : "folder"} 
                        size={24} 
                        color={getAttendanceColor(course.attendance)} 
                      />
                      <View style={styles.courseTitleContainer}>
                        <Text style={styles.courseCode}>{course.code}</Text>
                        <Text style={styles.courseName}>{course.name}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.courseFolderRight}>
                      <Text style={[
                        styles.attendancePercentage,
                        { color: getAttendanceColor(course.attendance) }
                      ]}>
                        {course.attendance}%
                      </Text>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.courseFolderContent}>
                      <View style={styles.courseProgressContainer}>
                        <Text style={styles.courseProgressLabel}>Attendance Progress:</Text>
                        <ProgressBar 
                          progress={course.attendance/100} 
                          color={getAttendanceColor(course.attendance)} 
                          style={styles.courseProgressBar} 
                        />
                      </View>
                      
                      <View style={styles.courseDetailStats}>
                        <View style={styles.courseDetailItem}>
                          <View style={[styles.courseDetailDot, {backgroundColor: '#4CAF50'}]} />
                          <Text style={styles.courseDetailText}>On Time: {Math.round(course.attendance * 0.8)}%</Text>
                        </View>
                        <View style={styles.courseDetailItem}>
                          <View style={[styles.courseDetailDot, {backgroundColor: '#FF9800'}]} />
                          <Text style={styles.courseDetailText}>Late: {Math.round(course.attendance * 0.2)}%</Text>
                        </View>
                        <View style={styles.courseDetailItem}>
                          <View style={[styles.courseDetailDot, {backgroundColor: '#F44336'}]} />
                          <Text style={styles.courseDetailText}>Missed: {100 - course.attendance}%</Text>
                        </View>
                      </View>
                      
                      <View style={styles.courseBtnContainer}>
                        <TouchableOpacity 
                          style={styles.courseDetailBtn}
                          onPress={() => router.push('/reports')}
                        >
                          <Text style={styles.courseDetailBtnText}>View Details</Text>
                          <MaterialCommunityIcons name="arrow-right" size={16} color="#27548A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>
        
        {/* Recent Activity */}
        <Card style={styles.sectionCard}>
          <Card.Title 
            title="Recent Activity" 
            left={(props) => <MaterialCommunityIcons {...props} name="history" size={24} color="#75A420" />}
            titleStyle={styles.sectionTitle}
          />
          <Card.Content>
            {recentActivities.map((item) => (
              <List.Item
                key={item.id}
                title={item.course}
                titleStyle={styles.activityTitle}
                description={`${item.date}${item.time ? ` • ${item.time}` : ''} • ${item.type}`}
                descriptionStyle={styles.activityDescription}
                left={props => (
                  <View style={[styles.statusDot, {backgroundColor: getStatusColor(item.status)}]}>
                    <MaterialCommunityIcons
                      name={
                        item.status === 'Present' ? "check" : 
                        item.status === 'Late' ? "clock-alert-outline" : 
                        item.status === 'Absent' ? "close" :
                        item.status === 'Submitted' ? "file-check" :
                        item.status === 'Completed' ? "check-circle" : "progress-clock"
                      }
                      size={14}
                      color="#FFF"
                    />
                  </View>
                )}
                right={() => (
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                )}
                style={styles.activityItem}
              />
            ))}
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => router.push('/reports')}
              style={styles.viewAllButton}
              labelStyle={styles.buttonLabel}
            >
              View All Records
            </Button>
          </Card.Actions>
        </Card>
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
    backgroundColor: '#75A420', // Fallback color if gradient doesn't load
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
  headerSubtitle: {
    color: '#FFFFFF99',
  },
  scrollView: {
    padding: 16,
  },
  // Hero card with profile
  heroCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  heroGradient: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#FFFFFF44',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 16,
    color: '#FFFFFFDD',
    marginBottom: 2,
  },
  courseInfo: {
    fontSize: 14,
    color: '#FFFFFFBB',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  welcomeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  // Section cards
  sectionCard: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Course items
  coursesContent: {
    padding: 0,
    backgroundColor: '#FFFFFF',
  },
  courseFolder: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#FFFFFF',
  },
  courseFolderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  courseFolderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  courseFolderRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  attendancePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  courseFolderContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  courseProgressContainer: {
    marginBottom: 12,
  },
  courseProgressLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  courseProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  courseDetailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  courseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  courseDetailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  courseDetailText: {
    fontSize: 12,
    color: '#666',
  },
  courseBtnContainer: {
    alignItems: 'flex-end',
  },
  courseDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(39, 84, 138, 0.1)',
  },
  courseDetailBtnText: {
    fontSize: 12,
    color: '#27548A',
    fontWeight: '600',
    marginRight: 4,
  },
  // Activity items
  activityItem: {
    padding: 0,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    backgroundColor: '#27548A',
    marginTop: 8,
  },
  buttonLabel: {
    fontSize: 14,
    color: '#FFF',
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
