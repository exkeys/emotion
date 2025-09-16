// utils/weeklyDataChecker.js
import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// 주간 데이터 완성도 체크
export async function checkWeeklyDataCompletion(userId = 'test_user') {
  try {
    // 오늘 날짜 기준 7일 범위로 주간 분석 (테스트용)
    const now = dayjs();
    const fromDate = now.format('YYYY-MM-DD');
    const toDate = now.add(6, 'day').format('YYYY-MM-DD');

    console.log('주간 데이터 체크 (테스트):', { fromDate, toDate });

    // 해당 7일간의 모든 기록 조회
    const { data, error } = await supabase
      .from('records')
      .select('date, fatigue, notes')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('주간 데이터 조회 오류:', error);
      return { isComplete: false, error: error.message };
    }

    // 7일 모두 데이터가 있는지 확인
    const recordDates = data.map(record => record.date);
    const expectedDates = [];
    for (let i = 0; i < 7; i++) {
      expectedDates.push(now.add(i, 'day').format('YYYY-MM-DD'));
    }

    // 7개 이상 기록 시 완성으로 간주
    const isComplete = recordDates.length >= 7;

    return {
      isComplete,
      weekRange: { from: fromDate, to: toDate },
      recordedDays: recordDates.length,
      totalDays: 7,
      data: data
    };

  } catch (error) {
    console.error('주간 데이터 체크 오류:', error);
    return { isComplete: false, error: error.message };
  }
}

// 분석 제안 상태 관리 (AsyncStorage 대신 메모리 사용)
let analysisProposalStatus = {};



export function getAnalysisProposalStatus(weekKey) {
  return analysisProposalStatus[weekKey] || false;
}

export const checkMonthlyDataCompletion = async (userId = 'test_user') => {
  try {
    // 현재 월의 시작~끝 날짜 계산
    const now = dayjs();
    const startOfMonth = now.startOf('month');
    const endOfMonth = now.endOf('month');

    const fromDate = startOfMonth.format('YYYY-MM-DD');
    const toDate = endOfMonth.format('YYYY-MM-DD');

    console.log('월간 데이터 체크:', { fromDate, toDate });

    // 해당 월간의 모든 기록 조회
    const { data, error } = await supabase
      .from('records')
      .select('date, fatigue, notes')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('월간 데이터 조회 오류:', error);
      return { isComplete: false, error: error.message };
    }

    // 월의 모든 날짜 구하기
    const daysInMonth = endOfMonth.date();
    const expectedDates = [];
    for (let i = 0; i < daysInMonth; i++) {
      expectedDates.push(startOfMonth.add(i, 'day').format('YYYY-MM-DD'));
    }

    const recordDates = data.map(record => record.date);
    console.log('expectedDates:', expectedDates);
    console.log('recordDates:', recordDates);
  // 15개 이상 기록 시 완성으로 간주
  const isComplete = recordDates.length >= 15;

    return {
      isComplete,
      monthRange: { from: fromDate, to: toDate },
      recordedDays: recordDates.length,
      totalDays: daysInMonth,
      data: data
    };
  } catch (error) {
    console.error('월간 데이터 체크 오류:', error);
    return { isComplete: false, error: error.message };
  }
};

export function setAnalysisProposalStatus(weekKey, status) {
  analysisProposalStatus[weekKey] = status;
}

export function getCurrentWeekKey() {
  return dayjs().startOf('isoWeek').format('YYYY-MM-DD');
}

// 월간 데이터 체크 결과 콘솔 출력 (테스트용)
checkMonthlyDataCompletion('test_user').then(result => {
  console.log('월간 데이터 체크 결과:', result);
});