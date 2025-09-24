# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.




새로고침 없이 뜨게 만드는 해법(수정 방향만 설명)
Supabase Realtime 구독(권장)
왜: 네이티브에서는 window 이벤트가 안정적이지 않습니다. DB에 기록이 저장되는 즉시 “서버-클라이언트” 이벤트로 챗봇이 변화를 감지하게 하면 새로고침이 불필요합니다.
방법: EnhancedChatbotScreen 마운트 시 records 테이블에 대해 user_id=현재 사용자 필터로 Realtime 구독 → INSERT/UPDATE 발생 시 checkAndProposeWeeklyAnalysis() 실행.
포인트: 다중 기기/백그라운드 저장까지 커버. 언마운트 시 반드시 unsubscribe.
RN 전용 이벤트 버스 사용(대안)
왜: window.dispatchEvent는 웹 전용에 가깝습니다. RN에서는 mitt 같은 경량 이벤트 버스나 DeviceEventEmitter를 사용해야 합니다.
방법: utils/eventBus을 하나 두고, useRecordManager에서 주간 7/7 완성 시 eventBus.emit('weeklyComplete'), 챗봇에서는 eventBus.on('weeklyComplete', checkAndProposeWeeklyAnalysis) 구독.
포인트: 같은 앱 프로세스 내 화면 간 통신에 적합. 웹/네이티브 모두 일관됨.
주간 판정 윈도우 통일(보완)
왜: 캘린더는 월~일, 체크는 “오늘~+6일”이면 7개를 넣어도 판정이 어긋날 수 있습니다.
방법: weeklyDataChecker에서 startOf('isoWeek') ~ add(6,'day')로 통일.
포인트: 데이터는 그대로 두고 “판정 기준”만 맞춥니다.
버튼 상태 토글(보완)
왜: 제안 메시지만 추가되고 pendingWeeklyAnalysis가 true로 안 바뀌면 UI 상 “수락/거절” 버튼이 안 뜰 수 있습니다.
방법: 제안 시점에 setPendingWeeklyAnalysis(true) 설정, 수락/거절/오류 시 false로 되돌림.
요약
근본 해결은 “window 이벤트”를 버리고 Realtime(최선) 또는 RN 이벤트 버스(차선)로 전파를 바꾸는 것입니다. 그 다음, 주간 판정 기준과 버튼 토글만 정리하면 새로고침 없이 바로 제안이 뜹니다. 원하시면 위 순서로 적용해 드릴게요.
