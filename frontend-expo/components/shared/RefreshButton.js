import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function RefreshButton({ onPress, loading }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.refreshButton} accessibilityLabel="새로고침" disabled={loading}>
      <MaterialIcons name="refresh" size={28} color={loading ? '#ccc' : '#007bff'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    marginLeft: 10,
    padding: 4,
  },
});