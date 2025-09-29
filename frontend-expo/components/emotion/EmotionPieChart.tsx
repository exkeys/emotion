import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import { getEmotionColor } from './emotionColors';

// records: [{ emotion: '행복', ... }]
export default function EmotionPieChart({ records }: { records: any[] }) {
  // 감정별 카운트 집계
  const emotionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((rec) => {
      if (rec.emotion) {
        counts[rec.emotion] = (counts[rec.emotion] || 0) + 1;
      }
    });
    return counts;
  }, [records]);

  const data = Object.entries(emotionCounts).map(([emotion, count]) => ({
    x: emotion,
    y: count,
    color: getEmotionColor(emotion)
  }));

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>감정 비율 파이차트</Text>
        <Text style={styles.placeholder}>데이터 없음</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>감정 비율 파이차트</Text>
      <VictoryPie
        data={data}
        innerRadius={40}
        labelRadius={70}
        style={{
          data: { fill: (args: any) => args.datum?.color },
          labels: { fontSize: 14, fill: '#222', fontWeight: 'bold' }
        }}
        labels={({ datum }: { datum: any }) => `${datum.x} (${datum.y})`}
        width={260}
        height={220}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  placeholder: { color: '#aaa', textAlign: 'center', padding: 24 }
});
