import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../theme';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Take Control of Your Debt
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Use the debt snowball method to become debt-free faster
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={[styles.featureIcon, { color: colors.brand.text }]}>📊</Text>
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Track all your debts in one place
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureIcon, { color: colors.success }]}>📈</Text>
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Visualize your debt-free timeline
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={[styles.featureIcon, { color: colors.warning }]}>🎉</Text>
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Celebrate milestones along the way
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.brand.primary }]}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes['3xl'],
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  features: {
    marginTop: theme.spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: theme.fonts.sizes.base,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  button: {
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
  },
});