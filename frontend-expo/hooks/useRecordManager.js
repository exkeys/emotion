import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { checkWeeklyDataCompletion, checkMonthlyDataCompletion } from '../utils/weeklyDataChecker';

export function useRecordManager(selectedDate, refreshWeeklyStatus) {
  const [fatigue, setFatigue] = useState(5);
  const [note, setNote] = useState('');
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);

  const [prevWeeklyComplete, setPrevWeeklyComplete] = useState(false);
  const [prevMonthlyComplete, setPrevMonthlyComplete] = useState(false);

  const handleSave = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    const user_id = 'test_user';
    
    console.log('Saving record:', { user_id, date: selectedDate, fatigue, notes: note });
    
    const { error } = await supabase
      .from('records')
      .upsert(
        { 
          user_id, 
          date: selectedDate, 
          fatigue: parseInt(fatigue),
          notes: note || null
        },
        { onConflict: ['user_id', 'date'] }
      );
    
    setLoading(false);
    
    if (error) {
      Alert.alert('저장 실패', error.message);
    } else {
      // 저장 후 해당 주간의 모든 기록을 fetch해서 setRecords에 반영
      try {
        const dayjs = require('dayjs');
        const weekStart = dayjs(selectedDate).weekday(1);
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
          weekDates.push(weekStart.add(i, 'day').format('YYYY-MM-DD'));
        }
        const { data: weekRecords, error: weekError } = await supabase
          .from('records')
          .select('date, fatigue, notes')
          .eq('user_id', user_id)
          .in('date', weekDates);
        if (!weekError && weekRecords) {
          const newRecords = {};
          weekRecords.forEach(rec => {
            newRecords[rec.date] = { fatigue: rec.fatigue, note: rec.notes };
          });
          setRecords(newRecords);
        }
      } catch (e) {
        console.error('주간 기록 fetch 중 오류:', e);
      }

      // 저장 후 주간 상태 다시 체크
      const updatedWeeklyStatus = await refreshWeeklyStatus();

      // 월간 데이터 체크
      const monthlyStatus = await checkMonthlyDataCompletion();
      console.log('월간 데이터 체크 결과:', monthlyStatus);

      // 주간 데이터 완성 알림 (이번에 처음 완성된 경우에만)
      if (updatedWeeklyStatus?.isComplete && !prevWeeklyComplete) {
        Alert.alert(
          '주간 기록 완성! 🎉',
          '이번 주 7일간의 기록이 모두 완성되었습니다!\n챗봇 탭에서 주간 분석을 확인해보세요.',
          [{ text: '확인', style: 'default' }]
        );
        setPrevWeeklyComplete(true);
        // 챗봇 탭에 주간 분석 제안 이벤트 전달
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('triggerWeeklyAnalysisProposal'));
        }
      } else if (!updatedWeeklyStatus?.isComplete) {
        setPrevWeeklyComplete(false);
      }

      // 월간 데이터 완성 알림 및 챗봇 트리거 (이번에 처음 완성된 경우에만)
      if (monthlyStatus.isComplete && !prevMonthlyComplete) {
        Alert.alert(
          '월간 기록 완성! 🎉',
          `이번 달 ${monthlyStatus.recordedDays}/${monthlyStatus.totalDays}일 기록이 완성되었습니다!\n챗봇 탭에서 월간 분석을 확인해보세요.`,
          [{ text: '확인', style: 'default' }]
        );
        setPrevMonthlyComplete(true);
        // 챗봇에 월간 분석 제안 트리거
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('triggerMonthlyAnalysisProposal'));
        }
      } else if (!monthlyStatus.isComplete) {
        setPrevMonthlyComplete(false);
      }

      return true; // 성공
    }
    return false; // 실패
  }, [selectedDate, fatigue, note, refreshWeeklyStatus, prevWeeklyComplete, prevMonthlyComplete]);

  const loadRecordForDate = useCallback(async (dateString) => {
    const user_id = 'test_user';
    console.log('Fetching record for date:', dateString);
    
    const { data, error } = await supabase
      .from('records')
      .select('fatigue, notes')
      .eq('user_id', user_id)
      .eq('date', dateString)
      .maybeSingle();
    
    if (!error && data) {
      setFatigue(data.fatigue);
      setNote(data.notes || '');
    } else {
      setFatigue(5);
      setNote('');
    }
  }, []);

  return {
    fatigue,
    note,
    records,
    loading,
    setFatigue,
    setNote,
    handleSave,
    loadRecordForDate
  };
}
