/**
 * 백엔드 게임 API 클라이언트 (`docs/API_FLOW.md` 기준).
 * 개발: Vite 프록시로 동일 출처 `/api`. 프로덕션: `VITE_API_BASE_URL`.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
  requestId: string;
}

export interface StartGameSessionBody {
  userId: string;
  scenarioId: string;
  difficulty?: string;
}

export interface GameObjectiveDto {
  id: string;
  title?: string;
  description?: string;
  text?: string;
  completed?: boolean;
}

export interface StartGameSessionData {
  sessionId: string;
  scenarioId?: string;
  startSceneId: string;
  createdAt?: string;
  initialState?: {
    objectives?: GameObjectiveDto[];
    companions?: string[];
    [key: string]: unknown;
  };
}

export interface SceneHotspotDto {
  id: string;
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface SceneData {
  sceneId?: string;
  id?: string;
  hotspots?: SceneHotspotDto[];
  exits?: unknown[];
  presentCompanions?: string[];
  [key: string]: unknown;
}

export interface InteractBody {
  sessionId: string;
  sceneId: string;
  action: string;
  targetId: string;
}

export interface DiscoveredClueDto {
  clueId: string;
  title?: string;
  description?: string;
}

export interface InteractData {
  discoveredClue?: DiscoveredClueDto | null;
  [key: string]: unknown;
}

export interface ActionBody {
  sessionId: string;
  actionType: string;
  rawInput: string;
}

export interface ClueUseBody {
  sessionId: string;
  clueId: string;
  targetId: string;
  inputValue: string;
}

export interface ClueUseData {
  isCorrect?: boolean;
  rewards?: { newClues?: string[]; unlockedAreas?: string[] };
  objectiveCompleted?: string;
  nextObjective?: string;
  [key: string]: unknown;
}

export interface CompanionChatBody {
  sessionId: string;
  companionId: string;
  message: string;
}

export interface CompanionHintBody {
  sessionId: string;
  companionId: string;
  currentObjectiveId: string;
}

export interface AffinityAnalyzeBody {
  sessionId: string;
  companionId: string;
  userMessage: string;
}

export interface AffinityEventBody {
  sessionId: string;
  companionId: string;
  eventType: string;
}

export interface AffinityPatchBody {
  sessionId: string;
  companionId: string;
  delta: number;
  reason?: string;
}

export interface SessionSaveBody {
  sessionId: string;
  currentSceneId: string;
  playTime: number;
  autoSave?: boolean;
}

export function getApiOrigin(): string {
  if (import.meta.env.DEV) return '';
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const origin = getApiOrigin();
  const base = path.startsWith('http') ? path : `${origin}${path}`;
  const u = base.startsWith('http') ? new URL(base) : new URL(base, 'http://local.invalid');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
    }
  }
  if (path.startsWith('http') || origin) {
    return `${u.origin}${u.pathname}${u.search}`;
  }
  return `${u.pathname}${u.search}`;
}

/** 응답이 `{ success, data }` 래퍼면 data를, 아니면 본문 전체를 반환 */
export function unwrapApiPayload<T>(parsed: unknown): T {
  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
    const env = parsed as ApiEnvelope<T>;
    if (env.success && env.data != null) return env.data;
    const msg = env.error?.message ?? 'API 오류';
    throw new Error(msg);
  }
  return parsed as T;
}

export class GameApiError extends Error {
  readonly status: number;
  readonly bodyText: string;

  constructor(message: string, status: number, bodyText: string) {
    super(message);
    this.name = 'GameApiError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

async function apiJson<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> },
): Promise<T> {
  const { query, ...rest } = init ?? {};
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.headers ?? {}),
    },
  });
  const rawText = await res.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const e = (parsed as ApiEnvelope<unknown>).error?.message;
      if (e) msg = e;
    } else if (typeof parsed === 'object' && parsed && 'message' in parsed) {
      msg = String((parsed as { message: unknown }).message);
    }
    throw new GameApiError(msg, res.status, rawText);
  }
  if (parsed === null) {
    throw new GameApiError('빈 응답', res.status, rawText);
  }
  try {
    return unwrapApiPayload<T>(parsed);
  } catch (e) {
    if (e instanceof Error && !(e instanceof GameApiError)) {
      throw new GameApiError(e.message, res.status, rawText);
    }
    throw e;
  }
}

export async function startGameSession(body: StartGameSessionBody): Promise<StartGameSessionData> {
  const origin = getApiOrigin();
  return apiJson<StartGameSessionData>(`${origin}/api/game/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: body.userId,
      scenarioId: body.scenarioId,
      difficulty: body.difficulty ?? 'normal',
    }),
  });
}

export async function getSession(sessionId: string): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/session/${encodeURIComponent(sessionId)}`);
}

export async function getScene(sceneId: string, sessionId: string): Promise<SceneData> {
  const origin = getApiOrigin();
  return apiJson<SceneData>(`${origin}/api/game/scene/${encodeURIComponent(sceneId)}`, {
    query: { sessionId },
  });
}

export async function postInteract(body: InteractBody): Promise<InteractData> {
  const origin = getApiOrigin();
  return apiJson<InteractData>(`${origin}/api/game/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postAction(body: ActionBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postClueUse(body: ClueUseBody): Promise<ClueUseData> {
  const origin = getApiOrigin();
  return apiJson<ClueUseData>(`${origin}/api/game/clue/use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postCompanionChat(body: CompanionChatBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/companion/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postCompanionHint(body: CompanionHintBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/companion/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postAffinityAnalyze(body: AffinityAnalyzeBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/companion/affinity/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postAffinityEvent(body: AffinityEventBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/companion/affinity/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function patchAffinity(body: AffinityPatchBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/companion/affinity`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export interface AffinityGetData {
  affinity?: { score?: number; level?: string; [key: string]: unknown };
  recentChanges?: unknown[];
  [key: string]: unknown;
}

export async function getAffinity(sessionId: string, companionId: string): Promise<AffinityGetData> {
  const origin = getApiOrigin();
  return apiJson<AffinityGetData>(`${origin}/api/companion/affinity`, {
    query: { sessionId, companionId },
  });
}

export async function getAffinityHistory(
  sessionId: string,
  companionId: string,
  limit = 20,
): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/companion/affinity/history`, {
    query: { sessionId, companionId, limit },
  });
}

export async function postSessionSave(body: SessionSaveBody): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/session/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getChatHistory(sessionId: string, companionId?: string): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/companion/chat/history`, {
    query: { sessionId, ...(companionId ? { companionId } : {}) },
  });
}

export async function getClues(sessionId: string): Promise<unknown> {
  const origin = getApiOrigin();
  return apiJson(`${origin}/api/game/clues`, {
    query: { sessionId },
  });
}

/** 텍스트 필드를 안전하게 뽑아 로그/채팅에 사용 */
export function pickText(obj: unknown, paths: string[]): string | null {
  if (obj == null) return null;
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  for (const p of paths) {
    const parts = p.split('.');
    let cur: unknown = o;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as object)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === 'string' && cur.trim()) return cur;
  }
  return null;
}
