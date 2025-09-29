
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryChart, VictoryAxis, VictoryScatter, VictoryLine } from 'victory-native';
import { getEmotionColor } from './emotionColors';

// 감정별 y값 매핑 (순서/가중치 조정 가능)
const EMOTION_Y: Record<string, number> = {
  '행복': 6,
  '보람': 5,
  '평온': 4,
  '기쁨': 3,
  '스트레스': 2,
  '불안': 1,
  '우울': 0,
  '분노': -1,
  '피곤': -2,
  '슬픔': -3
};

export default function EmotionTrendLine({ records }: { records: any[] }) {
  // 날짜 오름차순 정렬
  const sorted = [...records].sort((a, b) => (a.date > b.date ? 1 : -1));
  // 라인 데이터: [{ x: date, y: 감정값 }]
  const data = sorted.map((rec) => ({
    x: rec.date,
    y: EMOTION_Y[rec.emotion] ?? 0,
    emotion: rec.emotion
  }));

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>감정 변화 트렌드</Text>
        <Text style={styles.placeholder}>데이터 없음</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>감정 변화 트렌드</Text>
      <VictoryChart domainPadding={16} width={340} height={220}>
        <VictoryAxis
          tickFormat={(t: string) => t.slice(5)}
          style={{ tickLabels: { fontSize: 10, padding: 12, transform: 'rotate(-30)' } }}
        />
        <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 12 } }} />
        <VictoryLine
          data={data}
          style={{ data: { stroke: '#1976D2', strokeWidth: 2 } }}
        />
        <VictoryScatter
          data={data}
          size={6}
          style={{ data: { fill: (args: any) => getEmotionColor(args.datum?.emotion) } }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  placeholder: { color: '#aaa', textAlign: 'center', padding: 24 }
});
