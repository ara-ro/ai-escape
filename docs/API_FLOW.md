# API 호출 흐름 & 의존관계

이 문서는 16개 엔드포인트가 **어떤 순서로 호출되어야 하는지**, **각 호출이 어떤 데이터를 만들고 어떤 다음 호출에 쓰이는지**를 정리한 것입니다.

---

## 0. 전체 흐름 한눈에 보기

```
[1] session/start ──────────────────────────────────► sessionId 발급
                                │
                                ▼
[2] session/{id}  (선택)  ── 세션 상태 확인
                                │
                                ▼
[3] scene/{id}    ── 씬 정보, 핫스팟 목록 ──┐
                                            │
                                            ▼ targetId 사용
[4] interact      ── 핫스팟 조사 ──► clueId 획득 ──┐
                                                   │
[5] action        ── 자유 입력 (LLM 내레이션)      │
                                                   │
                                                   ▼ clueId, inputValue 사용
[6] clue/use      ── 단서로 퍼즐 해결 ──► objective 완료
                                            │
                                            ▼
[7] companion/chat       ── 폴리와 대화 (LLM) ──┐
[8] companion/hint       ── 힌트 요청 (LLM)     │── affinity 변동
[9] affinity/analyze     ── 메시지 감정분석(LLM)│
[10] affinity/event      ── 이벤트 호감도 변동  │
[11] affinity (PATCH)    ── 수동 호감도 조정    │
                                                ▼
[12] affinity (GET)      ── 누적 호감도 확인
[13] affinity/history    ── 호감도 변동 로그
                                │
                                ▼
[14] session/save        ── 게임 저장
[15] chat/history        ── 누적 대화 로그
[16] clues               ── 누적 단서 목록
```

---

## 1. 데이터 흐름 (어떤 호출의 출력이 어디에 입력되는가)

| 출력 데이터 | 만든 API | 사용하는 API |
|---|---|---|
| `sessionId` | `[1]` session/start | **[2]~[16] 모두** |
| `currentSceneId` | `[1]` (initialState) | `[3]` scene 조회 |
| `hotspot.id` (예: `hotspot_exit_sign`) | `[3]` scene 응답 | `[4]` interact의 `targetId` |
| `clueId` (예: `bloody_note`) | `[4]` interact 응답 | `[6]` clue/use, `[16]` clues 조회 |
| `objective.id` (예: `find_cabinet_password`) | `[1]` (initialState) | `[8]` hint 요청, `[6]` 완료 처리 |
| `companionId` (= `polly_parrot`) | `[1]` (initialState) | `[7]~[13]` 동료 관련 모두 |
| `affinity.score` 누적 | `[7]~[11]`이 갱신 | `[12]` 조회, `[13]` 이력 |

---

## 2. 단계별 상세 흐름

### Phase 1️⃣ — 세션 시작 (모든 흐름의 출발점)

#### [1] `POST /api/game/session/start`

**호출 시점:** 게임 시작 버튼을 누른 순간 (가장 먼저)

**Request**
```json
{ "userId": "test_user", "scenarioId": "abandoned_hospital_3f", "difficulty": "normal" }
```

**Response (핵심 필드)**
```json
{
  "sessionId": "sess_xxxxx",                    // ★ 이후 모든 호출에 사용
  "startSceneId": "ward_3f_hallway",            // → [3]에서 사용
  "initialState": {
    "objectives": [                              // → [8]에서 currentObjectiveId로 사용
      { "id": "find_cabinet_password", ... },
      { "id": "find_3f_exit", ... }
    ],
    "companions": ["polly_parrot"]              // → [7~13]에서 companionId로 사용
  }
}
```

**서버 내부 변화:**
- `sessions[sessionId]` 생성
- `affinity_store[(sessionId, polly_parrot)] = 50` (초기 호감도 중립)
- `chat_history_store[sessionId] = []`
- `clues_store[sessionId] = []`

---

#### [2] `GET /api/game/session/{sessionId}` *(선택)*

**호출 시점:** 게임 재진입 시 현재 진행 상태 확인

**의존:** [1]의 `sessionId`

**Response:** 현재 씬, 진행도, 발견한 단서, 마지막 저장 시각 반환

---

### Phase 2️⃣ — 씬 탐색

#### [3] `GET /api/game/scene/{sceneId}?sessionId=...`

**호출 시점:** 새 씬에 진입했을 때

**의존:**
- `sceneId` ← [1] 응답의 `startSceneId`
- `sessionId` ← [1]

**Response (핵심 필드)**
```json
{
  "hotspots": [
    { "id": "hotspot_exit_sign", ... },     // ★ → [4]의 targetId
    { "id": "hotspot_cabinet", ... }        // ★ → [4]의 targetId
  ],
  "exits": [...],
  "presentCompanions": ["polly_parrot"]
}
```

---

#### [4] `POST /api/game/interact` (핫스팟 조사)

**호출 시점:** 플레이어가 화면의 핫스팟 클릭

**의존:**
- `sessionId` ← [1]
- `sceneId` ← [3]
- `targetId` ← [3] 응답의 `hotspots[].id`

**Request**
```json
{ "sessionId": "...", "sceneId": "ward_3f_hallway", "action": "investigate", "targetId": "hotspot_exit_sign" }
```

**Response (핵심)**
```json
{
  "discoveredClue": {
    "clueId": "bloody_note",                 // ★ → [6]의 clueId
    "title": "피 묻은 메모",
    "description": "3-7-2-9... 숫자의 의미는?"   // ← 이게 [6]의 inputValue 힌트
  }
}
```

**서버 내부 변화:**
- `sessions[sessionId].discoveredClues`에 단서 추가
- `clues_store[sessionId]`에 단서 상세 추가
- 같은 `targetId`로 다시 호출하면 **409 Conflict**

**가능한 두 가지 호출:**
| `targetId` | 얻는 `clueId` |
|---|---|
| `hotspot_exit_sign` | `bloody_note` (비밀번호 힌트) |
| `hotspot_cabinet` | `cabinet_lock` (잠긴 자물쇠) |

---

#### [5] `POST /api/game/action` (자유 텍스트, **LLM 호출**)

**호출 시점:** 미리 정의된 핫스팟 외의 행동을 하고 싶을 때

**의존:** `sessionId` ← [1]

**Request**
```json
{ "sessionId": "...", "actionType": "free_text", "rawInput": "약장 위쪽을 살펴본다" }
```

**Response:** Ollama가 생성한 게임 마스터 내레이션 (1~2문장)

> ⚠️ Ollama 호출이라 응답이 느릴 수 있음 (수 초 ~ 30초)

---

### Phase 3️⃣ — 퍼즐 해결

#### [6] `POST /api/game/clue/use`

**호출 시점:** 단서를 다른 대상에 사용할 때 (자물쇠에 비밀번호 입력 등)

**의존:**
- `sessionId` ← [1]
- `clueId` ← [4]에서 얻은 단서
- `targetId` ← 단서를 사용할 대상
- `inputValue` ← 사용자가 입력한 값

**Request (정답 케이스)**
```json
{ "sessionId": "...", "clueId": "bloody_note", "targetId": "cabinet_lock", "inputValue": "3729" }
```

**Response (정답일 때)**
```json
{
  "isCorrect": true,
  "rewards": { "newClues": ["medicine_bottle"], "unlockedAreas": ["cabinet_interior"] },
  "objectiveCompleted": "find_cabinet_password",   // ★ objectives[0].completed = true
  "nextObjective": "find_3f_exit"                  // → [8]에서 currentObjectiveId로 사용
}
```

**서버 내부 변화:**
- 정답이면 `objectives[].completed = true` 갱신
- 단서 `isUsed = true` 표시

> 정답: `clueId="bloody_note"` + `inputValue="3729"`

---

### Phase 4️⃣ — AI 동료 상호작용 (전부 Ollama 호출)

#### [7] `POST /api/game/companion/chat` ⭐ LLM

**의존:** `sessionId` ← [1], `companionId` ← `polly_parrot`

**Request**
```json
{ "sessionId": "...", "companionId": "polly_parrot", "message": "이 약장 어떻게 열어?" }
```

**Response:**
- `companionResponse.text` — Ollama 응답 (해적 앵무새 말투)
- `affinityChange.delta = +2`, `newScore` — 자동 호감도 +2

**서버 내부 변화:**
- `chat_history_store`에 user/companion 메시지 2개 추가 → [15]에서 보임
- `affinity_store` +2, `affinity_history`에 기록 → [12], [13]에 반영

---

#### [8] `POST /api/game/companion/hint` ⭐ LLM

**의존:**
- `sessionId` ← [1]
- `currentObjectiveId` ← [1]의 objectives 또는 [6]의 nextObjective

**Request**
```json
{ "sessionId": "...", "companionId": "polly_parrot", "currentObjectiveId": "find_cabinet_password" }
```

**Response:** Ollama가 폴리 캐릭터로 생성한 힌트, `affinityCost: -1`

**서버 내부 변화:** affinity -1

---

#### [9] `POST /api/companion/affinity/analyze` ⭐ LLM

**용도:** 사용자 메시지의 감정/의도를 LLM이 분석해서 호감도 자동 조정

**Request (적대적)**
```json
{ "sessionId": "...", "companionId": "polly_parrot", "userMessage": "야 이 멍청한 새야" }
```

**Response:**
- `analysis.sentiment` — hostile/neutral/positive
- `affinityChange.delta` — LLM이 결정한 -10 ~ +10 사이 정수
- `companionReaction.mood` — 추천 응답 톤

**서버 내부 변화:** affinity ± delta

---

#### [10] `POST /api/companion/affinity/event`

**용도:** 게임 시스템 이벤트(힌트 무시, 퍼즐 해결 등)에 따른 자동 호감도 변동

**Request**
```json
{ "sessionId": "...", "companionId": "polly_parrot", "eventType": "solved_puzzle" }
```

**eventType 종류:**
| 값 | delta | 의미 |
|---|---|---|
| `ignored_hint` | -4 | 힌트 무시 |
| `used_hint` | +2 | 힌트 활용 |
| `solved_puzzle` | +5 | 퍼즐 해결 |
| `failed_puzzle` | -2 | 퍼즐 실패 |

---

#### [11] `PATCH /api/companion/affinity` (수동 조정)

**용도:** 디버그/스크립트 이벤트로 호감도 강제 조정

**Request**
```json
{ "sessionId": "...", "companionId": "polly_parrot", "delta": 20, "reason": "scripted_event" }
```

---

### Phase 5️⃣ — 호감도 조회

#### [12] `GET /api/companion/affinity?sessionId=...&companionId=polly_parrot`

**호출 시점:** UI에 호감도 게이지 표시할 때

**Response:**
- `affinity.score` — 현재 누적 점수 (0~100)
- `affinity.level` — hostile/wary/neutral/friendly/trusted
- `recentChanges` — 최근 3건

> [7]~[11] 호출이 누적된 결과

---

#### [13] `GET /api/companion/affinity/history?sessionId=...&companionId=...&limit=20`

**용도:** 호감도 변동 로그 페이지

**Response:**
- `history[]` — 모든 변동 이력 (delta, source, reason, timestamp)
- `nextCursor` — 다음 페이지

> [7]~[11]에서 `record_affinity_change()` 호출될 때마다 이 이력에 한 줄 추가

---

### Phase 6️⃣ — 저장 & 기록 조회

#### [14] `POST /api/game/session/save`

**의존:** `sessionId` ← [1]

**Request**
```json
{ "sessionId": "...", "currentSceneId": "ward_3f_hallway", "playTime": 1427, "autoSave": true }
```

**Response:** `saved: true`, `saveSlotId`

**서버 내부 변화:** `sessions[sessionId].lastSavedAt` 갱신

---

#### [15] `GET /api/game/companion/chat/history?sessionId=...`

**Response:** [7]에서 누적된 대화 로그 (user/companion 메시지 페어)

**필터 옵션:** `companionId`, `limit`, `cursor`, `before` (특정 시각 이전)

---

#### [16] `GET /api/game/clues?sessionId=...`

**Response:** [4]에서 발견한 모든 단서

**필터 옵션:** `status` (locked/unlocked/all), `sortBy` (discoveredAt/importance)

---

## 3. 시나리오별 호출 순서 예시

### 시나리오 A: 정공법으로 게임 클리어
```
[1] session/start
 → [3] scene 조회
 → [4] interact (hotspot_exit_sign)         # bloody_note 획득
 → [4] interact (hotspot_cabinet)           # cabinet_lock 발견
 → [6] clue/use (bloody_note + 3729)        # 퍼즐 해결!
 → [10] affinity/event (solved_puzzle)      # +5 호감도
 → [14] session/save
```

### 시나리오 B: 폴리에게 도움받기
```
[1] session/start
 → [7] companion/chat ("힌트 좀 줘")        # +2 호감도
 → [8] companion/hint                       # -1 호감도, LLM이 힌트 생성
 → [4] interact ...                          # 힌트 보고 조사
 → [12] affinity (GET)                      # 현재 점수 확인
```

### 시나리오 C: 호감도 망가뜨리기
```
[1] session/start
 → [9] affinity/analyze ("야 이 멍청한 새야")   # LLM 분석, -8쯤
 → [9] affinity/analyze ("쓸모없는 새")          # 또 -8쯤
 → [12] affinity (GET)                          # level: hostile 확인
 → [13] affinity/history                        # 변동 로그 확인
 → [11] affinity (PATCH, delta:+50)             # 디버그로 회복
```

### 시나리오 D: Ollama 연동 검증만
```
[1] session/start                # sessionId만 얻고
 → [7] companion/chat            # LLM 응답 확인
 → [5] action                    # LLM 내레이션 확인
 → [8] companion/hint            # LLM 힌트 확인
 → [9] affinity/analyze          # LLM 감정분석 확인
```

---

## 4. 인증

**현재 모든 엔드포인트는 인증 없음** — Authorization 헤더 불필요.
(이전엔 `Bearer <토큰>` 검사가 있었으나 로컬 개발용으로 제거됨)

---

## 5. Ollama 호출 vs 미호출 정리

| 호출 | Ollama 사용? | 응답 시간 |
|---|---|---|
| `[1]` session/start, `[2]`, `[3]` scene, `[4]` interact, `[6]` clue/use | ❌ | 즉시 |
| `[5]` action, `[7]` chat, `[8]` hint, `[9]` analyze | ✅ | 1~30초 |
| `[10]` event, `[11]` PATCH, `[12]`, `[13]`, `[14]` save, `[15]`, `[16]` | ❌ | 즉시 |

---

## 6. 데이터 저장소 매핑

서버는 메모리에만 저장 (서버 재시작 시 초기화):

| 저장소 | 키 | 갱신하는 API |
|---|---|---|
| `sessions` | `sessionId` | [1] 생성, [4]/[6]/[14]에서 갱신 |
| `affinity_store` | `(sessionId, companionId)` | [7]~[11]에서 갱신, [12]에서 조회 |
| `affinity_history` | `(sessionId, companionId)` | [7]~[11]이 한 줄씩 추가, [13] 조회 |
| `chat_history_store` | `sessionId` | [7]이 추가, [15] 조회 |
| `clues_store` | `sessionId` | [4]가 추가, [6]이 isUsed 갱신, [16] 조회 |
