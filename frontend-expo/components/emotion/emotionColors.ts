// 감정별 색상 매핑
export const EMOTION_COLORS: Record<string, string> = {
  '행복': '#FFD600', // 노랑
  '스트레스': '#FF5252', // 빨강
  '우울': '#536DFE', // 파랑
  '분노': '#FF7043', // 주황
  '불안': '#00B8D4', // 청록
  '평온': '#81C784', // 연두
  '보람': '#FFB300', // 진노랑
  '피곤': '#A1887F', // 갈색
  '기쁨': '#FFD740', // 밝은 노랑
  '슬픔': '#90A4AE', // 회색
  '기본': '#BDBDBD' // 기본 회색
};

export function getEmotionColor(emotion: string) {
  return EMOTION_COLORS[emotion] || EMOTION_COLORS['기본'];
}
