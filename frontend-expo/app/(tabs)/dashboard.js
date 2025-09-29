import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmotionCalendar from '../../components/emotion/EmotionCalendar';
import EmotionTrendLine from '../../components/emotion/EmotionTrendLine';

const mockRecords = [
  { date: '2025-09-20', emotion: '행복' },
  { date: '2025-09-21', emotion: '우울' },
  { date: '2025-09-22', emotion: '스트레스' },
  { date: '2025-09-23', emotion: '행복' },
  { date: '2025-09-24', emotion: '기쁨' },
  { date: '2025-09-25', emotion: '불안' },
  { date: '2025-09-26', emotion: '행복' },
];

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <EmotionCalendar records={mockRecords} />
      <EmotionTrendLine records={mockRecords} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fa', padding: 12 },
});