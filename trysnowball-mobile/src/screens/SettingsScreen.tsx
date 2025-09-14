import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

export default function SettingsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login' as never);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Account
        </Text>
        
        <View style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              {user?.email || 'Not logged in'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Referral' as never)}
        >
          <View style={styles.itemContent}>
            <Ionicons name="gift-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Referrals
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Preferences
        </Text>
        
        <View style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="moon-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={() => {}}
            trackColor={{ false: colors.border, true: colors.brand.primary }}
          />
        </View>

        <View style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Push Notifications
            </Text>
          </View>
          <Switch
            value={false}
            onValueChange={() => {}}
            trackColor={{ false: colors.border, true: colors.brand.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Support
        </Text>
        
        <TouchableOpacity style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Help & FAQ
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Contact Support
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, { backgroundColor: colors.surface }]}>
          <View style={styles.itemContent}>
            <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.itemText, { color: colors.text.primary }]}>
              Privacy Policy
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.text.muted }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: theme.fonts.sizes.base,
    marginLeft: theme.spacing.md,
  },
  logoutButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  version: {
    fontSize: theme.fonts.sizes.sm,
  },
});