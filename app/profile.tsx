import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { usePinsStore } from '../stores/pinsStore';
import { pinsApi } from '../services/api';

const ProfileScreen: React.FC = () => {
  const { user, logout, isCurrentUserAdmin } = useAuthStore();
  const { pins } = usePinsStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [users, setUsers] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = isCurrentUserAdmin();

  React.useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      loadUsers();
    }
  }, [activeTab, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await pinsApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await pinsApi.blockUser(userId);
              if (success) {
                setBlockedUsers([...blockedUsers, userId]);
                Alert.alert('Success', 'User has been blocked');
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              const success = await pinsApi.unblockUser(userId);
              if (success) {
                setBlockedUsers(blockedUsers.filter(id => id !== userId));
                Alert.alert('Success', 'User has been unblocked');
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const userReports = pins.filter(pin => pin.userId === user?.id).length;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'Logout',
          onPress: () => {
            logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedInText}>Not logged in</Text>
      </View>
    );
  }

  const filteredUsers = users.filter(u =>
    searchQuery === '' ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {isAdmin && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'profile' && styles.tabTextActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'admin' && styles.tabActive]}
            onPress={() => setActiveTab('admin')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'admin' && styles.tabTextActive,
              ]}
            >
              Admin Panel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'profile' ? (
        <ScrollView style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user.isAdmin ? (
                <Ionicons name="shield" size={48} color="#3b82f6" />
              ) : (
                <Ionicons name="person" size={48} color="#3b82f6" />
              )}
            </View>
            <Text style={styles.userName}>{user.email}</Text>
            {user.isAdmin && <Text style={styles.adminBadge}>🛡️ ADMIN</Text>}
            <Text style={styles.userAge}>Age: {user.age}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userReports}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user.reputation || 0}</Text>
              <Text style={styles.statLabel}>Reputation</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="notifications" size={20} color="#3b82f6" />
              <Text style={styles.settingText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="lock-closed" size={20} color="#3b82f6" />
              <Text style={styles.settingText}>Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.settingText}>About KER-Lab</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.adminPanel}>
          <View style={styles.adminHeader}>
            <Ionicons name="shield" size={24} color="#3b82f6" />
            <Text style={styles.adminTitle}>Admin Control Panel</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#d1d5db"
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={[styles.userAvatar, blockedUsers.includes(item.id) && styles.userAvatarBlocked]}>
                      <Ionicons name="person" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userEmail}>{item.email}</Text>
                      <Text style={styles.userMetadata}>Age: {item.age} • Reports: {pins.filter(p => p.userId === item.id).length}</Text>
                      {blockedUsers.includes(item.id) && (
                        <Text style={styles.blockedBadge}>🚫 BLOCKED</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      blockedUsers.includes(item.id)
                        ? handleUnblockUser(item.id, item.email)
                        : handleBlockUser(item.id, item.email)
                    }
                    style={[
                      styles.actionButton,
                      blockedUsers.includes(item.id) && styles.actionButtonUnblock,
                    ]}
                  >
                    <Ionicons
                      name={blockedUsers.includes(item.id) ? 'unlock' : 'lock-closed'}
                      size={18}
                      color={blockedUsers.includes(item.id) ? '#10b981' : '#ef4444'}
                    />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.userList}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  adminBadge: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userAge: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  logoutButton: {
    marginHorizontal: 12,
    marginVertical: 24,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notLoggedInText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#6b7280',
  },
  adminPanel: {
    flex: 1,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  loader: {
    marginTop: 20,
  },
  userList: {
    padding: 12,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarBlocked: {
    backgroundColor: '#ef4444',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  userMetadata: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  blockedBadge: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonUnblock: {
    backgroundColor: '#dcfce7',
  },
});

export default ProfileScreen;
