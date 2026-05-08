# API 연동 점검 메모

이 문서는 `docs/API_FLOW.md`를 기준으로 프론트를 연결한 뒤, **자동 테스트만으로는 검증되지 않거나 UI에 아직 붙지 않은 부분**, **백엔드와 스키마가 어긋날 때 생기는 리스크**를 정리합니다.

로컬에서 `npm run test`와 `npm run build`는 통과했습니다. **실제 백엔드·Ollama**는 이 저장소에 포함되어 있지 않아, 여기서는 네트워크 E2E를 실행하지 않았습니다.

---

## 1. UI에 연결된 API (요약)

| 단계 | 메서드 | UI에서의 사용 |
|------|---------|----------------|
| 세션 시작 | `POST /api/game/session/start` | 시작 화면의 「게임 시작」 |
| 씬 조회 | `GET /api/game/scene/{sceneId}` | 세션 시작 직후 자동 |
| 조사 | `POST /api/game/interact` | `GameRoom` 핫스팟 중 `exitDoor`→`hotspot_exit_sign`, `cabinet`→`hotspot_cabinet` |
| 자유 행동 | `POST /api/game/action` | 하단 명령 입력, 매핑 없는 조사 오브젝트 클릭 |
| 단서 사용 | `POST /api/game/clue/use` | 네 자리 숫자 입력(빠른 행동 `3729` 포함) 시, 단서 `bloody_note`·`cabinet_lock`이 모두 있을 때만 시도 |
| 동료 대화 | `POST /api/game/companion/chat` | NPC 패널 입력 |
| 힌트 | `POST /api/game/companion/hint` | NPC 패널 「힌트 요청」 |
| 호감도 조회 | `GET /api/companion/affinity` | 세션 시작 후·대화/힌트/퍼즐 이벤트 후 갱신 |
| 호감도 이벤트 | `POST /api/companion/affinity/event` | `clue/use` 정답 시 `solved_puzzle` |
| 저장 | `POST /api/game/session/save` | `clue/use` 정답 직후 자동 저장 시도 |
| 단서 목록 | `GET /api/game/clues` | 조사 후·정답 후 좌측 패널 |
| 채팅 이력 | `GET /api/game/companion/chat/history` | 세션 시작 후·동료 대화 후 |

---

## 2. 아직 UI에 없는 API (문서상 존재)

다음은 `API_FLOW.md`에 있으나 **현재 화면에서 호출하지 않습니다**. 필요 시 패널이나 디버그 메뉴로 추가하는 것이 좋습니다.

- `GET /api/game/session/{sessionId}` — 재진입·진행도 동기화
- `POST /api/companion/affinity/analyze` — 채팅과 별도의 감정 분석 트리거
- `PATCH /api/companion/affinity` — 수동 호감도 조정
- `GET /api/companion/affinity/history` — 호감도 로그 전용 UI 없음

---

## 3. 응답 형식에 대한 가정 (불일치 시 증상)

백엔드가 `{ success, data, error }` 래퍼를 쓰지 않으면, `unwrapApiPayload`가 본문 전체를 그대로 넘깁니다. 반대로 래퍼인데 `success: false`이면 즉시 예외가 납니다.

추가로 프론트는 다음 **관용 필드**를 읽습니다. 서버 키가 다르면 로그/대화/힌트 텍스트가 비거나 JSON 일부가 그대로 노출될 수 있습니다.

- `interact`: `discoveredClue.clueId`, `title`, `description`
- `companion/chat`, `companion/hint`, `action`: `pickText` 후보 경로 다수 (`text`, `message`, `companionResponse.text` 등)
- `GET /api/game/clues`: `clues` 또는 `items` 배열, 원소의 `clueId`/`id`, `title`, `description`
- `GET .../chat/history`: `messages` 또는 `history` 배열, 원소의 `role`/`sender`, `content`/`text`

**대화 스레드**: 히스토리 파싱 결과가 비어 있으면 기존 로컬 스레드를 덮어쓰지 않습니다. 서버가 다른 형태로 주면 NPC 패널과 서버 저장 내용이 어긋날 수 있습니다.

---

## 4. 시나리오·핫스팟 매핑

`src/game/scenario.ts`의 `API_HOTSPOT_BY_SCENARIO_OBJECT`가 문서의 `hotspot_exit_sign` / `hotspot_cabinet`에 고정 매핑되어 있습니다.

- 서버 `GET scene` 응답에 해당 `hotspots[].id`가 **없으면** `interact`는 404 등으로 실패할 수 있습니다.
- `vent` / `trash` / `bulletin` 등은 API 핫스팟이 없어 **`action` 자유 입력**으로만 처리합니다.

---

## 5. 빠른 행동 `3729` (스포일러)

`API_FLOW.md`에 적힌 정답 예시와 동일한 숫자가 빠른 행동에 포함되어 있습니다. **실제 플레이용 빌드에서는 제거하거나** 시나리오별로 분기하는 편이 안전합니다.

---

## 6. 백엔드·Ollama 관련 (실기기에서 확인할 것)

- Vite 프록시 대상은 `vite.config.ts`의 `VITE_API_BASE_URL` 또는 기본 `http://192.168.201.184:5000`입니다. 주소가 다르면 `.env`로 맞춰야 합니다.
- `action` / `companion/chat` / `companion/hint`는 Ollama 등 **느린 LLM**을 탈 수 있어 UI에 「처리 중」 오버레이를 띄웁니다. 타임아웃이 짧은 프록시/방화벽에서는 실패할 수 있습니다.
- 세션·단서 저장이 **서버 메모리 전용**이면 재시작 시 초기화됩니다 (`API_FLOW.md` 6절).

---

## 7. 권장 후속 작업

1. 실제 Swagger 응답 샘플을 한 번씩 캡처해 `normalize*` / `pickText` 경로를 확정한다.
2. `GET /api/game/session/{id}`로 재진입 플로우를 붙인다.
3. Vitest 외에 Playwright 등으로 `session/start` 이후 스모크 E2E를 추가한다 (백엔드 가동 환경 필요).
