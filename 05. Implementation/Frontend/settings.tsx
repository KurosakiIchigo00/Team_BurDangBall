import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, Image } from 'react-native';
import { Text, Appbar, List, Divider, Avatar, Button, Dialog, Portal, TextInput, Card, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [classRemindersEnabled, setClassRemindersEnabled] = useState(true);
  const [profileDialogVisible, setProfileDialogVisible] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const [studentInfo, setStudentInfo] = useState({
    name: 'Alex Johnson',
    id: 'S10045',
    email: 'alex.johnson@university.edu',
    program: 'Computer Science',
    semester: '3rd Semester',
    year: '2nd Year',
    phone: '+1 (555) 123-4567',
    address: '123 University Ave, Campus Housing B',
  });

  const [nameInput, setNameInput] = useState(studentInfo.name);
  const [emailInput, setEmailInput] = useState(studentInfo.email);
  const [phoneInput, setPhoneInput] = useState(studentInfo.phone);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const updateProfile = () => {
    setStudentInfo({
      ...studentInfo,
      name: nameInput,
      email: emailInput,
      phone: phoneInput
    });
    setProfileDialogVisible(false);
  };

  const updatePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    // In a real app, we would call an API to update the password
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogVisible(false);
  };

  const handleLogout = async () => {
    try {
      console.log('Initiating logout from settings...');
      setLogoutLoading(true);
      
      // Call logout API to update the LoggedIn record status
      console.log('Calling logout service...');
      const response = await authService.logout();
      console.log('Logout response from settings:', response);
      
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
      console.error('Logout error from settings:', error);
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
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="account-edit" onPress={() => {}} color="#FFF" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={70} 
              label={studentInfo.name.split(' ').map(n => n[0]).join('')} 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{studentInfo.name}</Text>
              <Text style={styles.userInfo}>{studentInfo.program} • {studentInfo.year}</Text>
              <Text style={styles.userId}>ID: {studentInfo.id}</Text>
            </View>
          </View>
          <Button 
            mode="contained" 
            onPress={() => setProfileDialogVisible(true)}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </Card>
        
        <Card style={styles.infoCard}>
          <Card.Title title="Student Information" />
          <Card.Content>
            <List.Item
              title="Email"
              description={studentInfo.email}
              left={() => <List.Icon icon="email" />}
            />
            <Divider />
            <List.Item
              title="Phone"
              description={studentInfo.phone}
              left={() => <List.Icon icon="phone" />}
            />
            <Divider />
            <List.Item
              title="Program"
              description={studentInfo.program}
              left={() => <List.Icon icon="school" />}
            />
            <Divider />
            <List.Item
              title="Semester"
              description={studentInfo.semester}
              left={() => <List.Icon icon="calendar-clock" />}
            />
          </Card.Content>
        </Card>
        
        <List.Section>
          <List.Subheader>App Settings</List.Subheader>
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch 
                value={darkMode} 
                onValueChange={setDarkMode} 
              />
            )}
          />
          <List.Item
            title="Notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch 
                value={notificationsEnabled} 
                onValueChange={setNotificationsEnabled}
              />
            )}
          />
          <List.Item
            title="Class Reminders"
            left={(props) => <List.Icon {...props} icon="bell-ring" />}
            right={() => (
              <Switch 
                value={classRemindersEnabled} 
                onValueChange={setClassRemindersEnabled}
              />
            )}
          />
          <Divider />
          
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Change Password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            onPress={() => setPasswordDialogVisible(true)}
          />
          <List.Item
            title="Download My Data"
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => {}}
          />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield" />}
            onPress={() => {}}
          />
          <List.Item
            title="Help & Support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Log Out"
            titleStyle={{ color: '#F44336' }}
            left={(props) => <List.Icon {...props} icon="logout" color="#F44336" />}
            onPress={() => setLogoutDialogVisible(true)}
          />
        </List.Section>
      </ScrollView>
      
      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={profileDialogVisible} onDismiss={() => setProfileDialogVisible(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={nameInput}
              onChangeText={setNameInput}
              style={styles.textInput}
            />
            <TextInput
              label="Email"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              style={styles.textInput}
            />
            <TextInput
              label="Phone"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              style={styles.textInput}
            />
            <Text style={styles.noteText}>
              Note: Some information can only be changed by contacting the university administration.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProfileDialogVisible(false)}>Cancel</Button>
            <Button onPress={updateProfile}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Change Password Dialog */}
      <Portal>
        <Dialog visible={passwordDialogVisible} onDismiss={() => setPasswordDialogVisible(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.textInput}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.textInput}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.textInput}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>Cancel</Button>
            <Button onPress={updatePassword}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
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
  profileSection: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#3F51B5',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 16,
    color: '#555',
  },
  userId: {
    fontSize: 14,
    color: '#777',
  },
  editButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
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