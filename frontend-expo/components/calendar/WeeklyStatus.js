import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WeeklyStatus({ weeklyStatus }) {
  if (!weeklyStatus) return null;
  
  return (
    <View style={styles.weeklyStatusContainer}>
      <Text style={styles.weeklyStatusText}>
        이번 주 기록: {weeklyStatus.recordedDays}/7일
        {weeklyStatus.isComplete && " ✅ 완성!"}
      </Text>
      {weeklyStatus.isComplete && (
        <Text style={styles.weeklyCompleteText}>
          챗봇 탭에서 주간 분석을 받아보세요! 🤖
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  weeklyStatusContainer: {
    padding: 10,
    backgroundColor: '#f0f9ff',
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 10
  },
  weeklyStatusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#0369a1'
  },
  weeklyCompleteText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#059669',
    marginTop: 5
  }
});