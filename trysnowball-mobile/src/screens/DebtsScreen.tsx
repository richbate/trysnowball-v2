import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useDebts, Debt } from '../hooks/useDebts';
import { theme } from '../theme';
import DebtCard from '../components/DebtCard';

export default function DebtsScreen() {
  const { colors } = useTheme();
  const { debts, addDebt, loading } = useDebts();
  const [modalVisible, setModalVisible] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: '',
    balance: '',
    minimumPayment: '',
    interestRate: '',
    type: 'credit_card' as const,
  });

  const handleAddDebt = async () => {
    if (!newDebt.name || !newDebt.balance || !newDebt.minimumPayment) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addDebt({
        name: newDebt.name,
        balance: parseFloat(newDebt.balance),
        minimumPayment: parseFloat(newDebt.minimumPayment),
        interestRate: parseFloat(newDebt.interestRate) || 0,
        type: newDebt.type,
      });
      setModalVisible(false);
      setNewDebt({
        name: '',
        balance: '',
        minimumPayment: '',
        interestRate: '',
        type: 'credit_card',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DebtCard debt={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={colors.text.muted} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No debts added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text.muted }]}>
              Add your first debt to start tracking
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Add New Debt
            </Text>

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary,
              }]}
              placeholder="Debt name"
              placeholderTextColor={colors.text.muted}
              value={newDebt.name}
              onChangeText={(text) => setNewDebt({ ...newDebt, name: text })}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary,
              }]}
              placeholder="Balance"
              placeholderTextColor={colors.text.muted}
              value={newDebt.balance}
              onChangeText={(text) => setNewDebt({ ...newDebt, balance: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary,
              }]}
              placeholder="Minimum payment"
              placeholderTextColor={colors.text.muted}
              value={newDebt.minimumPayment}
              onChangeText={(text) => setNewDebt({ ...newDebt, minimumPayment: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary,
              }]}
              placeholder="Interest rate (%)"
              placeholderTextColor={colors.text.muted}
              value={newDebt.interestRate}
              onChangeText={(text) => setNewDebt({ ...newDebt, interestRate: text })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.brand.primary }]}
                onPress={handleAddDebt}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Add Debt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.lg,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.base,
    marginTop: theme.spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.base,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: '600',
  },
});