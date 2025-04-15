import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Share, TouchableOpacity } from 'react-native';
import { Text, Button, Appbar, Card, Avatar, Title, Divider, Chip, Portal, Dialog, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/api';

export default function StudentQRScreen() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState({
    name: 'Alex Johnson',
    id: 'S10045',
    program: 'Computer Science',
    semester: '3rd Semester',
  });

  // Today's class schedule
  const [todayClasses, setTodayClasses] = useState([
    { id: 'CS301', name: 'Data Structures', time: '09:00 - 10:30 AM', room: 'Room 101', professor: 'Dr. Smith' },
    { id: 'CS302', name: 'Algorithms', time: '11:00 - 12:30 PM', room: 'Lab 201', professor: 'Dr. Johnson' },
    { id: 'CS303', name: 'Database Systems', time: '02:00 - 03:30 PM', room: 'Room 105', professor: 'Dr. Williams' },
  ]);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Student QR code data - permanent student identification data
  const studentQRData = JSON.stringify({
    studentId: studentInfo.id,
    name: studentInfo.name,
    program: studentInfo.program
  });

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const shareQRCode = async () => {
    try {
      await Share.share({
        message: 'Here is my attendance QR code',
        url: studentQRData, // In a real app, this would be a link to an image or a deep link
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      // Call logout API to update the LoggedIn record status
      const response = await authService.logout();
      
      // Close dialog after getting response
      setLogoutDialogVisible(false);
      
      // Show success message if the record was updated successfully
      if (response.success) {
        if (response.data && response.data.recordsUpdated > 0) {
          setSnackbarMessage('Logged out successfully. Session record updated.');
        } else {
          setSnackbarMessage('Logged out successfully.');
        }
        setSnackbarVisible(true);
        
        // Wait a moment before navigation to show the message
        setTimeout(() => {
          router.replace('/login');
        }, 1000);
      } else {
        // Even if API fails, we should still logout locally
        setSnackbarMessage('Logout had issues, but you were logged out locally.');
        setSnackbarVisible(true);
        
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLogoutDialogVisible(false);
      setSnackbarMessage('Error during logout, but you were logged out locally.');
      setSnackbarVisible(true);
      
      // Even if API fails, navigate to login after a delay
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#75A420', '#5A8016', '#456012']}
        style={styles.background}
      />
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Attendance QR" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="share-variant" onPress={shareQRCode} color="#FFF" />
        <Appbar.Action icon="logout" onPress={() => setLogoutDialogVisible(true)} color="#FFF" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* Main QR Card with prominent design */}
        <Card style={styles.qrCard}>
          <LinearGradient
            colors={['#75A420', '#5A8016', '#456012']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrGradient}
          >
            <View style={styles.qrHeader}>
              <Avatar.Text 
                size={60} 
                label={studentInfo.name.split(' ').map(n => n[0]).join('')} 
                style={styles.avatar} 
              />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentInfo.name}</Text>
                <Text style={styles.studentId}>ID: {studentInfo.id}</Text>
                <Chip style={styles.programChip}>{studentInfo.program}</Chip>
              </View>
            </View>
          </LinearGradient>
          
          <View style={styles.qrContent}>
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>YOUR ATTENDANCE QR CODE</Text>
              
              <View style={styles.qrCodeWrapper}>
                <MaterialCommunityIcons name="qrcode" size={200} color="#333" />
                <View style={styles.scanOverlay}>
                  <MaterialCommunityIcons name="scan-helper" size={220} color="rgba(117, 164, 32, 0.5)" />
                </View>
              </View>
              
              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>
                  This is your permanent QR code for attendance
                </Text>
              </View>
              
              <View style={styles.dateDisplay}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#27548A" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateText}>{today}</Text>
                  <Text style={styles.timeText}>Current time: {currentTime}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
        
        {/* Today's Schedule */}
        <Card style={styles.scheduleCard}>
          <Card.Title 
            title="Today's Classes" 
            titleStyle={styles.sectionTitle}
            left={(props) => <MaterialCommunityIcons {...props} name="calendar-text" size={24} color="#75A420" />}
          />
          <Card.Content style={styles.scheduleContent}>
            {todayClasses.map((course, index) => (
              <View key={course.id} style={[styles.classItem, index < todayClasses.length - 1 && styles.classItemBorder]}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIdentifier}>
                    <Text style={styles.courseCode}>{course.id}</Text>
                    <Text style={styles.courseName}>{course.name}</Text>
                  </View>
                  <Chip style={styles.timeChip} textStyle={styles.timeChipText}>{course.time}</Chip>
                </View>
                <View style={styles.courseDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#75A420" />
                    <Text style={styles.detailText}>{course.room}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="account" size={16} color="#75A420" />
                    <Text style={styles.detailText}>{course.professor}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
        
        {/* Instructions Card */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="How to Use" 
            titleStyle={styles.sectionTitle}
            left={(props) => <MaterialCommunityIcons {...props} name="information" size={24} color="#75A420" />}
          />
          <Card.Content>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Arrive at your class on time</Text>
            </View>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>When attendance is being taken, show this QR code to your lecturer</Text>
            </View>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>The lecturer will scan your QR code to mark your attendance</Text>
            </View>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepText}>Check the Reports section to confirm your attendance was recorded</Text>
            </View>
          </Card.Content>
          <Card.Content style={styles.warningContent}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
            <Text style={styles.warningText}>
              Never share your QR code with other students. Sharing your QR code may be considered academic dishonesty.
            </Text>
          </Card.Content>
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
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
  scrollView: {
    padding: 16,
  },
  // Main QR Card
  qrCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  qrGradient: {
    padding: 20,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  studentInfo: {
    marginLeft: 16,
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
    marginBottom: 8,
  },
  programChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
  },
  qrContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    width: '100%',
  },
  qrCodeWrapper: {
    position: 'relative',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanOverlay: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginVertical: 16,
    width: '100%',
  },
  securityText: {
    marginLeft: 8,
    color: '#2E7D32',
    flex: 1,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  dateInfo: {
    marginLeft: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Schedule Card
  scheduleCard: {
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
  scheduleContent: {
    padding: 0,
    backgroundColor: '#FFFFFF',
  },
  classItem: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  classItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseIdentifier: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeChip: {
    backgroundColor: '#EEF7E4',
  },
  timeChipText: {
    color: '#75A420',
    fontSize: 12,
  },
  courseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  // Instructions Card
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#75A420',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  loader: {
    marginRight: 12,
  },
  snackbar: {
    marginBottom: 16,
  },
}); 