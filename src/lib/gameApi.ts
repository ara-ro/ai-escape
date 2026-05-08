export interface StartGameSessionBody {
  userId: string;
  scenarioId: string;
}

export interface StartGameSessionSuccess {
  sessionId: string;
  scenarioId: string;
  startSceneId: string;
  createdAt: string;
  initialState: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
  requestId: string;
}

/** 개발 시 Vite 프록시로 같은 출처 `/api` 사용, 빌드 시 `VITE_API_BASE_URL` 필요 */
export function getApiOrigin(): string {
  if (import.meta.env.DEV) return '';
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

export async function startGameSession(
  body: StartGameSessionBody,
): Promise<{ ok: boolean; status: number; json: ApiEnvelope<StartGameSessionSuccess> | null; rawText: string }> {
  const origin = getApiOrigin();
  const url = `${origin}/api/game/session/start`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const rawText = await res.text();
  let json: ApiEnvelope<StartGameSessionSuccess> | null = null;
  try {
    json = JSON.parse(rawText) as ApiEnvelope<StartGameSessionSuccess>;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, rawText };
}
