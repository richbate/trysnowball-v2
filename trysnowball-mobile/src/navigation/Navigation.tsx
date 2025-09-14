import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import DebtsScreen from '../screens/DebtsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import MilestoneScreen from '../screens/MilestoneScreen';
import ReferralScreen from '../screens/ReferralScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Debts') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Milestones') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Debts" component={DebtsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Milestones" component={MilestoneScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Referral" 
        component={ReferralScreen}
        options={{ title: 'Invite Friends' }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { colors, isDarkMode } = useTheme();
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.brand.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text.primary,
          border: colors.border,
          notification: colors.brand.primary,
        },
      }}
    >
      {/* Switch between authenticated and non-authenticated flows */}
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}