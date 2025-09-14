import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

export default function ReferralScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const referralCode = user?.referralCode || 'SNOW123';
  const referralLink = `https://trysnowball.com?ref=${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on TrySnowball and start your debt-free journey! Use my referral code ${referralCode} or sign up with this link: ${referralLink}`,
        title: 'Join TrySnowball',
        url: referralLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="gift-outline" size={48} color={colors.brand.text} />
          
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Share TrySnowball
          </Text>
          
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            Help your friends become debt-free and earn rewards!
          </Text>

          <View style={[styles.codeContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.codeLabel, { color: colors.text.muted }]}>
              Your referral code
            </Text>
            <Text style={[styles.code, { color: colors.text.primary }]}>
              {referralCode}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.brand.primary }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
            Referral Benefits
          </Text>
          
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
              Your friend gets 1 month free Pro
            </Text>
          </View>
          
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
              You get 1 month free Pro for each referral
            </Text>
          </View>
          
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
              Help build a debt-free community
            </Text>
          </View>
        </View>
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
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fonts.sizes.base,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  codeContainer: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  codeLabel: {
    fontSize: theme.fonts.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  code: {
    fontSize: theme.fonts.sizes['2xl'],
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  shareButtonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  benefitsCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  benefitsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  benefitText: {
    flex: 1,
    fontSize: theme.fonts.sizes.base,
    marginLeft: theme.spacing.sm,
  },
});