import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useDebts } from '../hooks/useDebts';
import { theme } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { debts, totalDebt, monthlyPayment } = useDebts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text.primary }]}>
          Welcome back!
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Your debt-free journey continues
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="wallet-outline" size={24} color={colors.brand.text} />
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total Debt
          </Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {formatCurrency(totalDebt)}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="calendar-outline" size={24} color={colors.brand.text} />
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Monthly Payment
          </Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {formatCurrency(monthlyPayment)}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Quick Actions
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Debts' as never)}
        >
          <View style={styles.actionContent}>
            <Ionicons name="list-outline" size={24} color={colors.brand.text} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                Manage Debts
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.text.secondary }]}>
                {debts.length} active debts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Progress' as never)}
        >
          <View style={styles.actionContent}>
            <Ionicons name="trending-up-outline" size={24} color={colors.success} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                View Progress
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.text.secondary }]}>
                Track your timeline
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Milestones' as never)}
        >
          <View style={styles.actionContent}>
            <Ionicons name="trophy-outline" size={24} color={colors.warning} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                Milestones
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.text.secondary }]}>
                Celebrate your wins
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>
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
    paddingTop: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.base,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  quickActions: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: theme.spacing.md,
  },
  actionTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    marginTop: 2,
  },
});