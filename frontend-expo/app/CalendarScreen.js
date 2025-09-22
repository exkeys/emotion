import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import 'dayjs/locale/ko';

// 분리된 컴포넌트들
import CalendarView from '../components/calendar/CalendarView';
import RecordModal from '../components/calendar/RecordModal';
import WeeklyStatus from '../components/calendar/WeeklyStatus';

// 커스텀 훅들
import { useWeeklyData } from '../hooks/useWeeklyData';
import { useRecordManager } from '../hooks/useRecordManager';

dayjs.extend(weekday);
dayjs.locale('ko');

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 커스텀 훅으로 로직 분리
  const { weeklyStatus, refreshWeeklyStatus } = useWeeklyData();
  const { 
    fatigue, 
    note, 
    loading, 
    records,
    setFatigue,
    setNote,
    handleSave,
    loadRecordForDate
  } = useRecordManager(selectedDate, refreshWeeklyStatus);

  // 저장된 데이터가 변경될 때마다 주간 데이터 체크 (기존 로직 유지)
  useEffect(() => {
    if (selectedDate) {
      console.log('Checking weekly data for date:', selectedDate);
      const dateObj = dayjs(selectedDate);
      const weekStart = dateObj.weekday(1); // 1은 월요일
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        weekDates.push(weekStart.add(i, 'day').format('YYYY-MM-DD'));
      }
      console.log('Week dates (월~일):', weekDates);

      // supabase에서 해당 주의 모든 날짜 기록 fetch
      const checkWeekRecords = async () => {
        console.log('Fetching records for week...');
        const { supabase } = require('../utils/supabaseClient');
        const { data: weekRecords, error: weekError } = await supabase
          .from('records')
          .select('date, fatigue, notes')
          .eq('user_id', 'test_user')
          .in('date', weekDates);
        
        if (weekError) {
          console.error('Error fetching week records:', weekError);
          return;
        }

        console.log('Found records for dates:', weekRecords?.map(r => r.date));
        console.log('Total records found:', weekRecords?.length);
        
        if (weekRecords && weekRecords.length === 7) {
          console.log('Complete week found! Suggesting analysis for:', {
            from: weekDates[0],
            to: weekDates[6],
            records: weekRecords
          });
          suggestAnalysis({ from: weekDates[0], to: weekDates[6], records: weekRecords });
        } else {
          console.log('Week not complete yet. Need more records.');
        }
      };
      
      checkWeekRecords();
    }
  }, [records, selectedDate]);

  // 기존 주간 분석 함수 (그대로 유지)
  function suggestAnalysis({ from, to, records }) {
    if (!records || records.length === 0) return;
    const fatigueAvg = (
      records.reduce((sum, rec) => sum + (rec.fatigue || 0), 0) / records.length
    ).toFixed(2);
    const notes = records
      .map(
        (rec) =>
          `${rec.date} : ${rec.notes ? rec.notes : '(메모 없음)'}`
      )
      .join('\n');
    
    const { Alert } = require('react-native');
    Alert.alert(
      '주간 분석 결과',
      `기간: ${from} ~ ${to}\n\n평균 피곤함: ${fatigueAvg}\n\n메모:\n${notes}`,
      [{ text: '확인', style: 'default' }]
    );
  }

  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    await loadRecordForDate(day.dateString);
    setModalVisible(true);
  };

  const handleModalSave = async () => {
    const success = await handleSave();
    if (success) {
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <WeeklyStatus weeklyStatus={weeklyStatus} />
      
      <CalendarView 
        markedDates={records}
        onDayPress={handleDayPress}
      />

      <RecordModal
        visible={modalVisible}
        selectedDate={selectedDate}
        fatigue={fatigue}
        note={note}
        loading={loading}
        onFatigueChange={setFatigue}
        onNoteChange={setNote}
        onSave={handleModalSave}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40
  }
});