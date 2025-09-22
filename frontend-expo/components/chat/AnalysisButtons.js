import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function AnalysisButtons({ onAccept, onReject, type = 'weekly', disabled }) {
  return (
    <View style={styles.proposalButtons}>
      <TouchableOpacity
        style={[styles.proposalButton, styles.yesButton]}
        onPress={onAccept}
        disabled={disabled}
      >
        <Text style={styles.proposalButtonText}>네, {type === 'monthly' ? '월간' : '주간'} 분석해주세요!</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.proposalButton, styles.noButton]}
        onPress={onReject}
        disabled={disabled}
      >
        <Text style={styles.proposalButtonText}>아니요, 괜찮습니다</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  proposalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10,
  },
  proposalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#4caf50',
  },
  noButton: {
    backgroundColor: '#757575',
  },
  proposalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});