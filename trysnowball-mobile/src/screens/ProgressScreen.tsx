import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../theme';
import TimelineChart from '../components/TimelineChart';

export default function ProgressScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Your Debt-Free Timeline
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Track your progress month by month
        </Text>
      </View>

      <TimelineChart />

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Debt Free Date
          </Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            March 2027
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Time Remaining
          </Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            2 years 3 months
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Progress
          </Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            32%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.base,
  },
  stats: {
    padding: theme.spacing.lg,
  },
  statCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
  },
});