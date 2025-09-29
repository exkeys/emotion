import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getEmotionColor } from './emotionColors';

// records: [{ date: 'YYYY-MM-DD', emotion: '행복' }, ...]
export default function EmotionCalendar({ records }: { records: any[] }) {
  // 날짜별 감정 색상 매핑
  const markedDates = React.useMemo(() => {
    const map: Record<string, any> = {};
    records.forEach((rec) => {
      if (rec.date && rec.emotion) {
        map[rec.date] = {
          customStyles: {
            container: { backgroundColor: getEmotionColor(rec.emotion), borderRadius: 8 },
            text: { color: '#222', fontWeight: 'bold' }
          }
        };
      }
    });
    return map;
  }, [records]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>감정 캘린더 (Heatmap)</Text>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        style={styles.calendar}
        theme={{
          todayTextColor: '#1976D2',
          arrowColor: '#1976D2',
          textDayFontWeight: 'bold',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  calendar: { borderRadius: 8, elevation: 2, marginBottom: 8 }
});
