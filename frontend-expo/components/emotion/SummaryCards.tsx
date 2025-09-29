import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO: 실제 구현 (props: records[])
export default function SummaryCards({ records }: { records: any[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>감정 요약 카드</Text>
      {/* 최빈 감정, 최근 감정 등 */}
      <Text style={styles.placeholder}>요약 카드 영역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  placeholder: { color: '#aaa', textAlign: 'center', padding: 16 }
});
