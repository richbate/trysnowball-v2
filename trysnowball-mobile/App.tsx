import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ScrollView, Share } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Mock data
const DEMO_DEBTS = [
  { id: '1', name: 'Credit Card 1', balance: 3500, minPayment: 85, order: 1, type: 'credit_card' },
  { id: '2', name: 'Personal Loan', balance: 8200, minPayment: 245, order: 2, type: 'loan' },
  { id: '3', name: 'Car Loan', balance: 3500, minPayment: 420, order: 3, type: 'loan' },
];

// Simple auth context
const AuthContext = React.createContext<any>(null);

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [debts, setDebts] = React.useState(DEMO_DEBTS);

  const login = (email: string) => {
    setUser({ email });
    setIsAuthenticated(true);
    Alert.alert('Success', `Logged in as ${email}`);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const addDebt = (debt: any) => {
    const newDebt = {
      ...debt,
      id: Date.now().toString(),
      order: debts.length + 1,
    };
    setDebts([...debts, newDebt]);
  };

  const updateDebt = (id: string, updates: any) => {
    setDebts(debts.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout,
      debts,
      addDebt,
      updateDebt,
      deleteDebt
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper functions
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

const getDebtFreeDate = () => {
  const targetDate = new Date('2027-03-15');
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return `${diffMonths} months to go`;
};

// Add/Edit Debt Modal
function DebtModal({ visible, onClose, debt = null, onSave }: any) {
  const [name, setName] = React.useState(debt?.name || '');
  const [balance, setBalance] = React.useState(debt?.balance?.toString() || '');
  const [minPayment, setMinPayment] = React.useState(debt?.minPayment?.toString() || '');

  React.useEffect(() => {
    if (debt) {
      setName(debt.name);
      setBalance(debt.balance.toString());
      setMinPayment(debt.minPayment.toString());
    } else {
      setName('');
      setBalance('');
      setMinPayment('');
    }
  }, [debt]);

  const handleSave = () => {
    if (!name || !balance || !minPayment) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    onSave({
      name,
      balance: parseFloat(balance),
      minPayment: parseFloat(minPayment),
      type: 'credit_card',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{debt ? 'Edit Debt' : 'Add New Debt'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Debt Name</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Credit Card 1"
          />

          <Text style={styles.fieldLabel}>Current Balance</Text>
          <TextInput
            style={styles.modalInput}
            value={balance}
            onChangeText={setBalance}
            placeholder="0"
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>Minimum Payment</Text>
          <TextInput
            style={styles.modalInput}
            value={minPayment}
            onChangeText={setMinPayment}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>
    </Modal>
  );
}

// Milestone Modal
function MilestoneModal({ visible, onClose, milestone }: any) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎉 I just hit ${milestone}% of my debt-free journey on TrySnowball! Join me: https://trysnowball.com`,
        title: 'Debt-Free Milestone!',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.celebrationOverlay}>
        <View style={styles.celebrationCard}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>Milestone Reached!</Text>
          <Text style={styles.celebrationText}>You're {milestone}% debt-free!</Text>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share" size={20} color="white" />
            <Text style={styles.shareButtonText}>Share Achievement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.celebrationClose}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Login screen
function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const { login } = useAuth();

  return (
    <View style={styles.loginScreen}>
      <Text style={styles.loginEmoji}>❄️</Text>
      <Text style={styles.loginTitle}>TrySnowball</Text>
      <Text style={styles.loginSubtitle}>Track your debt-free journey</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          if (email) {
            login(email);
          } else {
            Alert.alert('Error', 'Please enter an email');
          }
        }}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => login('demo@example.com')}>
        <Text style={styles.linkText}>Try Demo Mode</Text>
      </TouchableOpacity>
    </View>
  );
}

// Home Screen
function HomeScreen() {
  const { user, debts } = useAuth();
  const [showMilestone, setShowMilestone] = React.useState(false);
  const totalDebt = debts.reduce((sum: number, debt: any) => sum + debt.balance, 0);
  const monthlyPayment = debts.reduce((sum: number, debt: any) => sum + debt.minPayment, 0);
  const totalOriginalDebt = 22200; // This would come from your debt history
  const paidOff = totalOriginalDebt - totalDebt;
  const progressPercent = totalOriginalDebt > 0 ? Math.round((paidOff / totalOriginalDebt) * 100) : 0;
  
  // Dynamic messaging based on progress and time
  const topDebt = debts.length > 0 ? debts.sort((a, b) => a.balance - b.balance)[0] : null;
  
  const getMotivationalMessage = () => {
    if (progressPercent >= 90) return `Almost there! Just £${totalDebt.toFixed(0)} left to go! 🏁`;
    if (progressPercent >= 75) return `You're in the home stretch! Keep hammering ${topDebt?.name || 'your debts'}! 💪`;
    if (progressPercent >= 50) return `Halfway there! The momentum is incredible! 🔥`;
    if (progressPercent >= 25) return `Great progress! You're building serious momentum! 📈`;
    if (progressPercent >= 10) return `Nice start! Keep chipping away at ${topDebt?.name || 'your top debt'}! 🎯`;
    return `Ready to tackle ${topDebt?.name || 'your debts'}? Let's do this! 💪`;
  };
  
  const getProgressMotivation = () => {
    if (progressPercent >= 75) return `You've cleared 3/4 of your debt — the finish line is in sight!`;
    if (progressPercent >= 50) return `Halfway there! Can you boost your snowball this month?`;
    if (progressPercent >= 33) return `You've cleared 1/3 of your debt — keep this streak alive.`;
    if (progressPercent >= 25) return `Quarter of the way there — momentum is building!`;
    if (progressPercent >= 10) return `Great start! Let's hammer ${topDebt?.name || 'your top debt'} this month.`;
    return `Every payment gets you closer to freedom. You've got this!`;
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const userName = user?.email?.split('@')[0] || 'Champion';
    return `${timeGreeting}, ${userName}!`;
  };

  
  React.useEffect(() => {
    // Show milestone celebration on load (demo)
    const timer = setTimeout(() => {
      if (progressPercent >= 25 && progressPercent % 25 === 0) {
        setShowMilestone(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [progressPercent]);
  
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeEmoji}>❄️</Text>
        <Text style={styles.title}>{getGreeting()}</Text>
        <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
        <Text style={styles.countdown}>🗓️ Debt-free by {getDebtFreeDate()}</Text>
      </View>
      
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <Text style={styles.progressPercent}>{progressPercent}% debt-free</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>£{paidOff.toLocaleString()}</Text>
            <Text style={styles.progressStatLabel}>Paid Off</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>£{totalDebt.toLocaleString()}</Text>
            <Text style={styles.progressStatLabel}>Remaining</Text>
          </View>
        </View>
        <Text style={styles.progressMotivation}>{getProgressMotivation()}</Text>
      </View>
      
      <View style={styles.quickStats}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{debts.length}</Text>
          <Text style={styles.statLabel}>Active Debts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>£{monthlyPayment}</Text>
          <Text style={styles.statLabel}>Monthly Minimums</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{Math.ceil(totalDebt / (monthlyPayment + 100))}</Text>
          <Text style={styles.statLabel}>Months to Go</Text>
        </View>
      </View>
      
      {progressPercent >= 50 && (
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneEmoji}>🎉</Text>
          <Text style={styles.milestoneTitle}>Milestone Unlocked!</Text>
          <Text style={styles.milestoneSubtitle}>You're {progressPercent}% debt-free!</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => Share.share({
              message: `I'm now ${progressPercent}% debt-free! £${paidOff.toLocaleString()} paid off and counting! 💪 #DebtFree #Progress`
            })}
          >
            <Text style={styles.shareButtonText}>Share This Win! 📤</Text>
          </TouchableOpacity>
        </View>
      )}


      <MilestoneModal 
        visible={showMilestone} 
        onClose={() => setShowMilestone(false)}
        milestone={progressPercent}
      />
    </ScrollView>
  );
}

// Debts Screen
function DebtsScreen() {
  const { debts, addDebt, updateDebt, deleteDebt } = useAuth();
  const [showModal, setShowModal] = React.useState(false);
  const [editingDebt, setEditingDebt] = React.useState<any>(null);

  const handleEditDebt = (debt: any) => {
    setEditingDebt(debt);
    setShowModal(true);
  };

  const handleSaveDebt = (debtData: any) => {
    if (editingDebt) {
      updateDebt(editingDebt.id, debtData);
    } else {
      addDebt(debtData);
    }
    setEditingDebt(null);
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.emoji}>💳</Text>
          <Text style={styles.title}>Your Debts</Text>
          <Text style={styles.subtitle}>{debts.length} active debts</Text>
        </View>
      
      {debts.map((debt: any, index: number) => (
        <TouchableOpacity 
          key={debt.id} 
          style={styles.debtCard}
          onPress={() => handleEditDebt(debt)}
        >
          <View style={styles.debtHeader}>
            <View style={styles.debtOrder}>
              <Text style={styles.orderNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.debtInfo}>
              <Text style={styles.debtName}>{debt.name}</Text>
              <Text style={styles.cardDetail}>Tap to edit</Text>
            </View>
          </View>
          <Text style={styles.debtBalance}>{formatCurrency(debt.balance)}</Text>
          <Text style={styles.cardDetail}>Min payment: {formatCurrency(debt.minPayment)}/month</Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setEditingDebt(null);
          setShowModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="#2563EB" />
        <Text style={styles.addButtonText}>Add New Debt</Text>
      </TouchableOpacity>

      <DebtModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDebt(null);
        }}
        debt={editingDebt}
        onSave={handleSaveDebt}
      />
      </ScrollView>
    </View>
  );
}

// Payments Screen
function PaymentsScreen() {
  const { debts } = useAuth();
  const [payments, setPayments] = React.useState<{[key: string]: boolean}>({});
  const currentMonth = dayjs().format('MMMM YYYY');
  const currentMonthKey = dayjs().format('YYYY-MM');
  
  // Load payment status from storage
  React.useEffect(() => {
    const loadPayments = async () => {
      try {
        const storedPayments = await AsyncStorage.getItem(`payments-${currentMonthKey}`);
        if (storedPayments) {
          setPayments(JSON.parse(storedPayments));
        }
      } catch (error) {
        console.log('Failed to load payments:', error);
      }
    };
    loadPayments();
  }, [currentMonthKey]);
  
  // Save payment status
  const togglePayment = async (debtId: string) => {
    const newPayments = { ...payments, [debtId]: !payments[debtId] };
    setPayments(newPayments);
    try {
      await AsyncStorage.setItem(`payments-${currentMonthKey}`, JSON.stringify(newPayments));
    } catch (error) {
      console.log('Failed to save payments:', error);
    }
  };
  
  const completedCount = Object.values(payments).filter(Boolean).length;
  const totalCount = debts.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  
  // Sort debts by snowball priority (smallest balance first)
  const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
  
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>Payments — {currentMonth}</Text>
          <Text style={styles.subtitle}>Have you made your payments this month?</Text>
          {sortedDebts.length > 0 && (
            <Text style={styles.coachText}>Remember: focus on {sortedDebts[0].name}</Text>
          )}
        </View>
        
        {sortedDebts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No debts to track</Text>
            <Text style={styles.cardDetail}>Add some debts to start tracking payments</Text>
          </View>
        ) : (
          <>
            {!allCompleted && (
              <View style={styles.progressCard}>
                <Text style={styles.cardTitle}>Progress This Month</Text>
                <Text style={styles.cardValue}>{completedCount} of {totalCount} paid</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }]} />
                </View>
              </View>
            )}
            
            {sortedDebts.map((debt, index) => {
              const isPaid = payments[debt.id] || false;
              const isHighestPriority = index === 0;
              
              return (
                <TouchableOpacity
                  key={debt.id}
                  style={[
                    styles.paymentCard,
                    isPaid && styles.paymentCardPaid,
                    isHighestPriority && styles.paymentCardPriority
                  ]}
                  onPress={() => togglePayment(debt.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentCardLeft}>
                    <View style={[styles.checkbox, isPaid && styles.checkboxChecked]}>
                      {isPaid && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.paymentCardContent}>
                      <Text style={[
                        styles.cardTitle,
                        isHighestPriority && styles.priorityText
                      ]}>
                        {debt.name} {isHighestPriority && '⭐'}
                      </Text>
                      <Text style={styles.cardDetail}>£{debt.minimumPayment} minimum</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentStatus}>
                    {isPaid ? '✅' : '⏳'}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {allCompleted && (
              <View style={[styles.card, styles.successCard]}>
                <Text style={styles.emoji}>🎉</Text>
                <Text style={styles.cardTitle}>All payments complete!</Text>
                <Text style={styles.cardDetail}>You're one step closer to being debt-free!</Text>
              </View>
            )}
            
            {!allCompleted && completedCount > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Keep going!</Text>
                <Text style={styles.cardDetail}>
                  {totalCount - completedCount} payment{totalCount - completedCount !== 1 ? 's' : ''} remaining this month
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Progress Screen  
function ProgressScreen() {
  const progressPercent = 32;
  
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.emoji}>📈</Text>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>{progressPercent}% debt-free</Text>
        </View>
        
        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paid Off</Text>
          <Text style={styles.cardValue}>£7,000</Text>
          <Text style={styles.cardDetail}>Keep up the momentum!</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Remaining</Text>
          <Text style={styles.cardValue}>£15,200</Text>
          <Text style={styles.cardDetail}>You've got this!</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Milestone</Text>
          <Text style={styles.cardValue}>50% debt-free</Text>
          <Text style={styles.cardDetail}>£3,900 to go</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Settings Screen
function SettingsScreen() {
  const { logout, user } = useAuth();
  
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.emoji}>⚙️</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>{user?.email || 'Demo User'}</Text>
        </View>
      
      <TouchableOpacity style={styles.settingsCard} onPress={() => Alert.alert('Theme', 'Theme settings coming soon!')}>
        <View style={styles.settingsCardContent}>
          <Text style={styles.cardTitle}>Theme</Text>
          <Text style={styles.cardDetail}>Light Mode</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingsCard} onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')}>
        <View style={styles.settingsCardContent}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardDetail}>Enabled</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingsCard} onPress={() => Alert.alert('Referrals', 'Invite friends coming soon!')}>
        <View style={styles.settingsCardContent}>
          <Text style={styles.cardTitle}>Invite Friends</Text>
          <Text style={styles.cardDetail}>Share your success</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Debts') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2563EB',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Debts" component={DebtsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

function AuthNavigator() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add padding for tab bar
  },
  screenHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  loginScreen: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  countdown: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debtCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  debtOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  debtBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 5,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  cardDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: 'white',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  // Celebration modal
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    margin: 20,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  celebrationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  celebrationClose: {
    color: '#666',
    fontSize: 16,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsCardContent: {
    flex: 1,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardPaid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  paymentCardPriority: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentCardContent: {
    marginLeft: 16,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentStatus: {
    fontSize: 20,
  },
  priorityText: {
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
    alignItems: 'center',
  },
  coachText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  motivationalText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  progressStat: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressMotivation: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});