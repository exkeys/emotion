import { useState, useEffect } from 'react';
import { checkWeeklyDataCompletion } from '../utils/weeklyDataChecker';

export function useWeeklyData() {
  const [weeklyStatus, setWeeklyStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkCurrentWeekStatus = async () => {
    setLoading(true);
    try {
      const result = await checkWeeklyDataCompletion();
      setWeeklyStatus(result);
      return result;
    } catch (error) {
      console.error('주간 상태 체크 오류:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 주간 상태 체크
  useEffect(() => {
    checkCurrentWeekStatus();
  }, []);

  return {
    weeklyStatus,
    loading,
    refreshWeeklyStatus: checkCurrentWeekStatus
  };
}
