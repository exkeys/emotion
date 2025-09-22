  import React, { useState, useRef, useEffect } from "react";
  // 기록 저장 등에서 window 이벤트로 분석 체크를 트리거할 수 있도록 이벤트 리스너 등록
// chrono-node 제거, 직접 한글 날짜 파싱 함수 구현
import dayjs from 'dayjs';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { checkWeeklyDataCompletion, getAnalysisProposalStatus, setAnalysisProposalStatus, getCurrentWeekKey } from '../utils/weeklyDataChecker';
import { checkMonthlyDataCompletion } from '../utils/weeklyDataChecker';
import Constants from 'expo-constants';

export default function EnhancedChatbotScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [pendingWeeklyAnalysis, setPendingWeeklyAnalysis] = useState(false);
  const [pendingMonthlyAnalysis, setPendingMonthlyAnalysis] = useState(false);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const scrollViewRef = useRef();


  // 월간 분석 제안 체크 함수 (항상 선언)
  async function checkAndProposeMonthlyAnalysis() {
    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      if (!backendUrl) throw new Error('Backend URL이 설정되지 않았습니다');
      const result = await checkMonthlyDataCompletion();
      console.log('월간 데이터 체크 결과:', result);
      if (result.isComplete && !pendingMonthlyAnalysis) {
        setMonthlyData(result.monthRange);
        // 중복 제안 메시지 방지
        const alreadyHasMonthlyProposal = messages.some(m => m.isMonthlyProposal);
        if (!alreadyHasMonthlyProposal) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `이번 달(${result.monthRange.from} ~ ${result.monthRange.to}) 15일 이상 기록이 완성되었습니다! 🎉\n\n월간 감정 패턴을 분석해드릴까요?`,
            isMonthlyProposal: true
          }]);
        }
        setPendingMonthlyAnalysis(true);
      }
    } catch (error) {
      console.error('월간 분석 체크 오류:', error);
    }
  }

  // 앱 초기화 및 주간/월간 데이터 체크
  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      await apiClient.initialize();
      setIsReady(true);
      await checkAndProposeWeeklyAnalysis();
      await checkAndProposeMonthlyAnalysis();
    } catch (error) {
      console.error('App initialization error:', error);
      setError(error.message);
      Alert.alert(
        '연결 오류',
        error.message,
        [{ text: '다시 시도', onPress: initializeApp }]
      );
    }
  }

  // 새로고침 버튼 핸들러
  const handleRefresh = async () => {
    setLoading(true);
    await checkAndProposeWeeklyAnalysis();
    await checkAndProposeMonthlyAnalysis();
    setLoading(false);
  };

  // 주간 분석 제안 체크
  async function checkAndProposeWeeklyAnalysis() {
    if (isAnalyzing) return; // 중복 분석 방지
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      if (!backendUrl) throw new Error('Backend URL이 설정되지 않았습니다');
      const weekKey = getCurrentWeekKey();
      const alreadyProposed = getAnalysisProposalStatus(weekKey);
      const result = await checkWeeklyDataCompletion();
      console.log('주간 데이터 체크 결과:', result);
      if (result.isComplete && !alreadyProposed && !pendingWeeklyAnalysis) {
        setWeeklyData(result.weekRange);
        // 중복 제안 메시지 방지
        const alreadyHasWeeklyProposal = messages.some(m => m.isWeeklyProposal);
        if (!alreadyHasWeeklyProposal) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `안녕하세요! 이번 주(${result.weekRange.from} ~ ${result.weekRange.to}) 7일간의 감정 기록이 완성되었네요! 🎉\n\n주간 감정 패턴을 분석해드릴까요?`,
            isWeeklyProposal: true
          }]);
        }
        // 주간 분석 요청 및 fetch를 result.weekRange로 바로 실행
        console.log('주간 분석 요청:', result.weekRange);
        if (!result.weekRange || !result.weekRange.from || !result.weekRange.to) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "주간 분석을 위한 데이터가 충분하지 않습니다. 기록을 더 입력해 주세요."
          }]);
          setPendingWeeklyAnalysis(false);
          setWeeklyData(null);
          setLoading(false);
          setIsAnalyzing(false);
          return;
        }
        const response = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: result.weekRange.from,
            to: result.weekRange.to,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setAnalysisError(data.error || '분석 중 오류가 발생했습니다');
          throw new Error(data.error || '분석 중 오류가 발생했습니다');
        }
        setAnalysisResult(data.result);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `📊 이번 주 감정 분석 결과:\n\n${data.result}`,
          isAnalysisResult: true
        }]);
      }
    } catch (error) {
      setAnalysisError(error.message);
      console.error('주간 분석 오류:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      }]);
    }
    setPendingWeeklyAnalysis(false);
    setWeeklyData(null);
    setLoading(false);
    setIsAnalyzing(false);
  }

  // 사용자 응답 처리
  // 주간 분석 버튼 핸들러
  const handleWeeklyAnalysisButton = async () => {
    if (isAnalyzing) return;
    try {
      console.log('주간 분석 버튼 클릭됨');
      setMessages(prev => [...prev, { role: "user", content: '네, 주간 분석해주세요!' }]);
      await checkAndProposeWeeklyAnalysis();
    } catch (error) {
      setAnalysisError(error.message);
      console.error('주간 분석 실행 중 오류:', error);
    }
  };

  // 기록 저장 시 외부에서 발생시키는 제안 이벤트 리스너 등록
  useEffect(() => {
    function handleMonthlyProposal() {
      checkAndProposeMonthlyAnalysis();
    }
    function handleWeeklyProposal() {
      checkAndProposeWeeklyAnalysis();
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('triggerMonthlyAnalysisProposal', handleMonthlyProposal);
      window.addEventListener('triggerWeeklyAnalysisProposal', handleWeeklyProposal);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('triggerMonthlyAnalysisProposal', handleMonthlyProposal);
        window.removeEventListener('triggerWeeklyAnalysisProposal', handleWeeklyProposal);
      }
    };
  }, []);
  // 주간 분석 거절 버튼 핸들러
  const handleWeeklyAnalysisReject = () => {
    console.log('주간 분석 거절 버튼 클릭됨');
    setPendingWeeklyAnalysis(false);
    setWeeklyData(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "알겠습니다! 언제든지 필요하시면 말씀해주세요. 😊"
    }]);
  };
  // 월간 분석 버튼 핸들러
  const handleMonthlyAnalysisButton = async () => {
    try {
      console.log('월간 분석 버튼 클릭됨');
      setMessages(prev => [...prev, { role: "user", content: '네, 월간 분석해주세요!' }]);
      await performMonthlyAnalysis();
    } catch (error) {
      console.error('월간 분석 실행 중 오류:', error);
    }
  };

  // robust 월간 분석 함수 (null check 포함)
  async function performMonthlyAnalysis() {
    if (!monthlyData || !monthlyData.from || !monthlyData.to) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "월간 분석을 위한 데이터가 충분하지 않습니다. 기록을 더 입력해 주세요."
      }]);
      setPendingMonthlyAnalysis(false);
      setMonthlyData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      if (!backendUrl) throw new Error('Backend URL이 설정되지 않았습니다');
      const response = await fetch(`${backendUrl}/analyze-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: monthlyData.from, to: monthlyData.to })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '월간 분석 중 오류가 발생했습니다');
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `📅 ${monthlyData.from} ~ ${monthlyData.to} 월간 감정 분석 결과:\n\n${data.result}`,
        isAnalysisResult: true
      }]);
    } catch (error) {
      console.error('월간 분석 오류:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "월간 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      }]);
    }
    setPendingMonthlyAnalysis(false);
    setMonthlyData(null);
    setLoading(false);
  }
  // 월간 분석 거절 버튼 핸들러
  const handleMonthlyAnalysisReject = () => {
    console.log('월간 분석 거절 버튼 클릭됨');
    setPendingMonthlyAnalysis(false);
    setMonthlyData(null);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "알겠습니다! 언제든지 필요하시면 말씀해주세요. 😊"
    }]);
  };

  // 일반 채팅 메시지 전송
  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || loading || !isReady) return;

    const userMessage = messageText.trim();
    if (!pendingWeeklyAnalysis) {
      setInput("");
      setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    }
    setLoading(true);

    // 1. 자연어에서 날짜/기간 파싱 및 분석 의도 감지
    try {
      const isAnalysisIntent = userMessage.includes('분석');
      // 한글 날짜 파싱 함수
      function parseKoreanDate(text) {
        if (text.includes('오늘')) return { from: dayjs(), to: dayjs() };
        if (text.includes('어제')) return { from: dayjs().subtract(1, 'day'), to: dayjs().subtract(1, 'day') };
        if (text.includes('내일')) return { from: dayjs().add(1, 'day'), to: dayjs().add(1, 'day') };
        // YYYY년 MM월 DD일 ~ YYYY년 MM월 DD일
        const rangeMatch = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (rangeMatch) {
          return {
            from: dayjs(`${rangeMatch[1]}-${rangeMatch[2]}-${rangeMatch[3]}`),
            to: dayjs(`${rangeMatch[4]}-${rangeMatch[5]}-${rangeMatch[6]}`)
          };
        }
        // YYYY년 MM월 DD일
        const match = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (match) return { from: dayjs(`${match[1]}-${match[2]}-${match[3]}`), to: dayjs(`${match[1]}-${match[2]}-${match[3]}`) };
        // MM월 DD일 ~ MM월 DD일 (올해)
        const rangeMatch2 = text.match(/(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (rangeMatch2) {
          const year = dayjs().year();
          return {
            from: dayjs(`${year}-${rangeMatch2[1]}-${rangeMatch2[2]}`),
            to: dayjs(`${year}-${rangeMatch2[3]}-${rangeMatch2[4]}`)
          };
        }
        // MM월 DD일 (올해)
        const match2 = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
        if (match2) {
          const year = dayjs().year();
          return { from: dayjs(`${year}-${match2[1]}-${match2[2]}`), to: dayjs(`${year}-${match2[1]}-${match2[2]}`) };
        }
        return null;
      }
      const dateRange = parseKoreanDate(userMessage);
      if (dateRange && isAnalysisIntent) {
        const fromDate = dateRange.from.format('YYYY-MM-DD');
        const toDate = dateRange.to.format('YYYY-MM-DD');
        const backendUrl = Constants.expoConfig?.extra?.backendUrl;
        if (!backendUrl) throw new Error('Backend URL이 설정되지 않았습니다');
        // 분석 API 호출
        const response = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromDate, to: toDate })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '분석 중 오류가 발생했습니다');
        }
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `📊 ${fromDate}${fromDate !== toDate ? ` ~ ${toDate}` : ''} 감정 분석 결과:\n\n${data.result}`,
          isAnalysisResult: true
        }]);
      } else {
        // 기존 챗봇 대화
        const aiMsg = await apiClient.sendChatMessage(userMessage);
        setMessages(prev => [...prev, { role: "assistant", content: aiMsg }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev,
        { role: "assistant", content: error.message?.includes('날짜') ? "날짜를 이해하지 못했어요. 예시: 5월 15일, 9월 한달, 6월 10일부터 20일까지" : "죄송합니다. 오류가 발생했습니다." }
      ]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>감정 케어 AI</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} accessibilityLabel="새로고침" disabled={loading}>
          <MaterialIcons name="refresh" size={28} color={loading ? '#ccc' : '#007bff'} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={[styles.chatBox, !isReady && styles.chatBoxDisabled]}>
        <ScrollView ref={scrollViewRef}>
          {messages.map((msg, i) => (
            <View key={i} style={[
              styles.messageRow,
              msg.role === "user" ? styles.userRow : styles.aiRow
            ]}>
              <View style={[
                styles.messageBubble,
                msg.role === "user" ? styles.userBubble : styles.aiBubble,
                msg.isWeeklyProposal && styles.proposalBubble,
                msg.isAnalysisResult && styles.analysisBubble
              ]}>
                <Text style={{ 
                  color: msg.role === "user" ? "white" : "black",
                  lineHeight: 20
                }}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <Text style={styles.loading}>AI가 답변을 작성중입니다...</Text>
          )}
          {isAnalyzing && (
            <Text style={styles.loading}>분석 중입니다...</Text>
          )}
          {analysisError && (
            <Text style={[styles.loading, { color: 'red' }]}>분석 오류: {analysisError}</Text>
          )}
          {analysisResult && (
            <Text style={[styles.loading, { color: 'green' }]}>분석 완료!</Text>
          )}
        </ScrollView>
      </View>

      {/* 주간 분석 제안 버튼 */}
      {pendingWeeklyAnalysis && (
        <View style={styles.proposalButtons}>
          <TouchableOpacity
            style={[styles.proposalButton, styles.yesButton]}
            onPress={handleWeeklyAnalysisButton}
            disabled={loading}
          >
            <Text style={styles.proposalButtonText}>네, 주간 분석해주세요!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proposalButton, styles.noButton]}
            onPress={handleWeeklyAnalysisReject}
            disabled={loading}
          >
            <Text style={styles.proposalButtonText}>아니요, 괜찮습니다</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 월간 분석 제안 버튼 */}
      {pendingMonthlyAnalysis && (
        <View style={styles.proposalButtons}>
          <TouchableOpacity
            style={[styles.proposalButton, styles.yesButton]}
            onPress={handleMonthlyAnalysisButton}
            disabled={loading}
          >
            <Text style={styles.proposalButtonText}>네, 월간 분석해주세요!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proposalButton, styles.noButton]}
            onPress={handleMonthlyAnalysisReject}
            disabled={loading}
          >
            <Text style={styles.proposalButtonText}>아니요, 괜찮습니다</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 일반 입력창 */}
      {!pendingWeeklyAnalysis && (
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            style={styles.input}
            placeholder="메시지를 입력하세요..."
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={[styles.button, (loading || !input.trim()) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>전송</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 60,
    paddingHorizontal: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 4,
  },
  chatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10
  },
  messageRow: {
    marginVertical: 5,
    flexDirection: "row"
  },
  userRow: {
    justifyContent: "flex-end"
  },
  aiRow: {
    justifyContent: "flex-start"
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 15
  },
  userBubble: {
    backgroundColor: "#007bff"
  },
  aiBubble: {
    backgroundColor: "#e9ecef"
  },
  proposalBubble: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3"
  },
  analysisBubble: {
    backgroundColor: "#f3e5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#9c27b0"
  },
  loading: {
    color: "#666",
    marginTop: 10,
    fontStyle: "italic"
  },
  proposalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10
  },
  proposalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  yesButton: {
    backgroundColor: "#4caf50"
  },
  noButton: {
    backgroundColor: "#757575"
  },
  proposalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    backgroundColor: "#fff"
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#007bff"
  },
  buttonDisabled: {
    backgroundColor: "#ccc"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  errorBanner: {
    backgroundColor: "#ffebee",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ef9a9a"
  },
  errorText: {
    color: "#c62828",
    textAlign: "center"
  },
  chatBoxDisabled: {
    opacity: 0.7
  }
});