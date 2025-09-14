import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Debt } from '../hooks/useDebts';
import { theme } from '../theme';

interface DebtCardProps {
  debt: Debt;
  onPress?: () => void;
}

export default function DebtCard({ debt, onPress }: DebtCardProps) {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getDebtIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return 'card-outline';
      case 'loan':
        return 'cash-outline';
      case 'mortgage':
        return 'home-outline';
      default:
        return 'wallet-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getDebtIcon(debt.type) as any}
            size={24}
            color={colors.brand.text}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: colors.text.primary }]}>
            {debt.name}
          </Text>
          <Text style={[styles.type, { color: colors.text.muted }]}>
            {debt.type.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Balance
          </Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {formatCurrency(debt.balance)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Min Payment
          </Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {formatCurrency(debt.minimumPayment)}
          </Text>
        </View>

        {debt.interestRate > 0 && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Interest Rate
            </Text>
            <Text style={[styles.value, { color: colors.text.primary }]}>
              {debt.interestRate}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
  },
  type: {
    fontSize: theme.fonts.sizes.sm,
    textTransform: 'capitalize',
  },
  details: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
  },
  value: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
  },
});