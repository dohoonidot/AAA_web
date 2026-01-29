# SSE (Server-Sent Events) 알림 시스템

## 개요

React 웹앱에서 실시간 알림을 수신하기 위한 SSE 연결 시스템.

- **엔드포인트**: `https://ai2great.com:8060/sse/notifications`
- **인증**: 쿠키 기반 (`session_id`) + 쿼리 파라미터 fallback

## 관련 파일

| 파일 | 설명 |
|------|------|
| `web_app/src/hooks/useSseNotifications.ts` | SSE 연결 React Hook |
| `web_app/src/services/sseService.ts` | SSE 연결 관리 클래스, ACK API |
| `web_app/src/types/notification.ts` | 알림 타입 정의 |

## 에러 분석 (2026-01-29)

### 발생 에러

```
[useSseNotifications] ERROR: SSE 에러:
- readyState: 2 (CLOSED)
- url: https://ai2great.com:8060/sse/notifications
- withCredentials: true
```

### EventSource readyState 값

| 값 | 상수 | 의미 |
|----|------|------|
| 0 | CONNECTING | 연결 중 |
| 1 | OPEN | 연결됨 |
| 2 | CLOSED | 연결 닫힘 |

### 가능한 원인

#### 1. CORS 문제 (가장 가능성 높음)

`withCredentials: true`로 크로스 도메인 요청 시 서버에서 다음 헤더 필요:

```
Access-Control-Allow-Origin: [특정 도메인]  # 와일드카드 * 사용 불가
Access-Control-Allow-Credentials: true
```

#### 2. 인증 실패

- `session_id` 쿠키가 없거나 만료됨
- 쿼리 파라미터로도 session_id 전송 중 (`sseService.ts:187`)

#### 3. 서버 연결 거부

- 서버 다운 또는 8060 포트 차단
- SSL 인증서 문제

#### 4. 네트워크 문제

- 방화벽이 SSE 연결 차단
- 프록시가 long-polling 연결 종료

## 디버깅 방법

### 1. 브라우저 Network 탭 확인

1. F12 → Network 탭
2. 필터에 `sse` 또는 `notifications` 입력
3. 페이지 새로고침
4. `sse/notifications` 요청 클릭하여 확인:
   - Status 코드
   - Response Headers
   - Response 본문

### 2. 상태 코드별 의미

| 코드 | 의미 | 해결 방향 |
|------|------|----------|
| 200 | 정상 연결 후 끊김 | 서버 측 타임아웃/keep-alive 설정 확인 |
| 401 | 인증 실패 | 로그인 상태/session_id 쿠키 확인 |
| 403 | 권한 없음 | CORS 또는 서버 권한 설정 확인 |
| 404 | 엔드포인트 없음 | URL 경로 확인 |
| 502/503 | 서버 오류 | 백엔드 서버 상태 확인 |

### 3. 쿠키 확인

브라우저 개발자 도구 → Application 탭 → Cookies → `session_id` 존재 여부

### 4. curl로 서버 테스트

```bash
curl -v -N "https://ai2great.com:8060/sse/notifications?session_id=YOUR_SESSION" \
  -H "Accept: text/event-stream"
```

## 서버 측 요구사항

### CORS 설정 (필수)

```python
# FastAPI 예시
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # 특정 도메인
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### SSE 응답 헤더

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## 코드 구조

### SseConnection 클래스 (`sseService.ts`)

```typescript
// 연결 생성
const connection = new SseConnection({
  url: '/sse/notifications',
  withCredentials: true,
  onStateChange: (state) => { /* DISCONNECTED, CONNECTING, CONNECTED, ERROR */ },
  onError: (error) => { /* 에러 처리 */ },
});

// 연결 시작
const eventSource = connection.connect();

// 이벤트 리스너 등록
eventSource.addEventListener('notification', (e) => {
  const data = JSON.parse(e.data);
});

// 연결 종료
connection.disconnect();
```

### useSseNotifications Hook (`useSseNotifications.ts`)

```typescript
const { connectionState, reconnect, isConnected } = useSseNotifications({
  enabled: isLoggedIn,
  onNotification: (envelope) => {
    // 알림 처리
  },
});
```

## TODO

- [ ] Network 탭에서 실제 응답 상태 코드 확인
- [ ] 서버 CORS 설정 확인
- [ ] session_id 쿠키 전달 여부 확인
- [ ] 서버 로그에서 SSE 요청 확인
