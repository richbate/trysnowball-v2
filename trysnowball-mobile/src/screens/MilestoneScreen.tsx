import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../theme';

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  percentage: number;
}

export default function MilestoneScreen() {
  const { colors } = useTheme();

  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'First Debt Paid Off',
      description: 'Credit Card 1 cleared!',
      date: '2024-12-15',
      completed: true,
      percentage: 15,
    },
    {
      id: '2',
      title: '25% Complete',
      description: 'Quarter of the way there!',
      date: '2025-02-01',
      completed: true,
      percentage: 25,
    },
    {
      id: '3',
      title: '50% Complete',
      description: 'Halfway to debt freedom!',
      date: '2025-08-15',
      completed: false,
      percentage: 50,
    },
    {
      id: '4',
      title: '75% Complete',
      description: 'Final stretch!',
      date: '2026-03-01',
      completed: false,
      percentage: 75,
    },
    {
      id: '5',
      title: 'Debt Free!',
      description: 'All debts paid off!',
      date: '2027-03-15',
      completed: false,
      percentage: 100,
    },
  ];

  const handleShare = async (milestone: Milestone) => {
    try {
      await Share.share({
        message: `I just hit a major milestone on my debt-free journey! ${milestone.title} 🎉 Join me on TrySnowball and start your own journey!`,
        title: 'Debt-Free Milestone',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Your Milestones
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Celebrate every win on your journey
        </Text>
      </View>

      <View style={styles.milestoneList}>
        {milestones.map((milestone) => (
          <View
            key={milestone.id}
            style={[
              styles.milestoneCard,
              { 
                backgroundColor: colors.surface,
                opacity: milestone.completed ? 1 : 0.7,
              },
            ]}
          >
            <View style={styles.milestoneHeader}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: milestone.completed ? colors.success : colors.surfaceSecondary }
              ]}>
                <Ionicons
                  name={milestone.completed ? 'checkmark-circle' : 'flag-outline'}
                  size={24}
                  color={milestone.completed ? 'white' : colors.text.muted}
                />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[styles.milestoneTitle, { color: colors.text.primary }]}>
                  {milestone.title}
                </Text>
                <Text style={[styles.milestoneDescription, { color: colors.text.secondary }]}>
                  {milestone.description}
                </Text>
                <Text style={[styles.milestoneDate, { color: colors.text.muted }]}>
                  {milestone.completed ? 'Completed' : 'Expected'}: {milestone.date}
                </Text>
              </View>
            </View>

            {milestone.completed && (
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: colors.brand.primary }]}
                onPress={() => handleShare(milestone)}
              >
                <Ionicons name="share-social" size={18} color="white" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
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
  milestoneList: {
    paddingHorizontal: theme.spacing.lg,
  },
  milestoneCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  milestoneDescription: {
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  milestoneDate: {
    fontSize: theme.fonts.sizes.xs,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  shareButtonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
});