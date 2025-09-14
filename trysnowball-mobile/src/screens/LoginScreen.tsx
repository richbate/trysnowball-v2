import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { login, verifyMagicLink } = useAuth();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await login(email);
      setCodeSent(true);
      Alert.alert('Success', 'Check your email for the magic link!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await verifyMagicLink(verificationCode);
      navigation.navigate('Main' as never);
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Welcome to TrySnowball
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Track your debt payoff journey
        </Text>

        {!codeSent ? (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.brand.primary },
              ]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.codeInstruction, { color: colors.text.secondary }]}>
              Enter the verification code from your email
            </Text>
            
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Enter verification code"
              placeholderTextColor={colors.text.muted}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.brand.primary },
              ]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCodeSent(false);
                setVerificationCode('');
              }}
            >
              <Text style={[styles.linkText, { color: colors.brand.text }]}>
                Use a different email
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.base,
  },
  button: {
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
  },
  codeInstruction: {
    fontSize: theme.fonts.sizes.base,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  linkText: {
    fontSize: theme.fonts.sizes.base,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});