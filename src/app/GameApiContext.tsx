import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  GameApiError,
  getAffinity,
  getChatHistory,
  getClues,
  getScene,
  pickText,
  postAction,
  postAffinityEvent,
  postClueUse,
  postCompanionChat,
  postCompanionHint,
  postInteract,
  postSessionSave,
  startGameSession,
} from '@/lib/gameApi';
import { API_HOTSPOT_BY_SCENARIO_OBJECT, INITIAL_CLOCK, POLY_OPENING_LINE } from '@/game/scenario';
import type { GameMessage, NpcChatMessage, NpcEmotion, ObjectiveDisplay, ScenarioObjectId } from '@/game/types';
import { bumpClock } from '@/game/engine';

export const DEFAULT_SCENARIO_ID = 'abandoned_hospital_3f';
export const DEFAULT_COMPANION_ID = 'polly_parrot';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pushLog(prev: GameMessage[], clock: string, text: string, type: GameMessage['type']): GameMessage[] {
  return [...prev, { id: newId(), text, type, timestamp: clock }];
}

function mapAffinityLevelToEmotion(level: string | null | undefined): NpcEmotion {
  const l = (level ?? '').toLowerCase();
  if (l.includes('hostile') || l.includes('wary')) return 'sad';
  if (l.includes('friend') || l.includes('trust')) return 'happy';
  if (l.includes('neutral')) return 'neutral';
  return 'curious';
}

function objectivesFromInitial(objs: unknown): ObjectiveDisplay[] {
  if (!Array.isArray(objs)) return [];
  return objs.map((o) => {
    const row = o as Record<string, unknown>;
    const id = String(row.id ?? '');
    const text = String(row.title ?? row.text ?? row.description ?? id);
    return { id, text, completed: Boolean(row.completed) };
  });
}

function mergeObjectiveCompletion(prev: ObjectiveDisplay[], completedId: string): ObjectiveDisplay[] {
  return prev.map((o) => (o.id === completedId ? { ...o, completed: true } : o));
}

function normalizeCluesResponse(res: unknown): { id: string; title: string; description: string; time: string }[] {
  if (res == null) return [];
  const root = res as Record<string, unknown>;
  const raw = root.clues ?? root.items ?? root.data;
  const arr = Array.isArray(raw) ? raw : Array.isArray(res) ? (res as unknown[]) : [];
  return arr.map((item, i) => {
    if (typeof item === 'string') {
      return { id: item, title: item, description: '', time: '' };
    }
    const o = item as Record<string, unknown>;
    return {
      id: String(o.clueId ?? o.id ?? `clue_${i}`),
      title: String(o.title ?? o.name ?? o.clueId ?? '단서'),
      description: String(o.description ?? o.detail ?? ''),
      time: String(o.discoveredAt ?? o.time ?? ''),
    };
  });
}

function normalizeChatThread(res: unknown): NpcChatMessage[] {
  const root = (res ?? {}) as Record<string, unknown>;
  const raw = root.messages ?? root.history ?? root.items ?? root.data;
  const arr = Array.isArray(raw) ? raw : [];
  const out: NpcChatMessage[] = [];
  for (const item of arr) {
    if (typeof item !== 'object' || !item) continue;
    const o = item as Record<string, unknown>;
    const role = String(o.role ?? o.sender ?? o.from ?? '').toLowerCase();
    const text = String(o.content ?? o.text ?? o.message ?? '').trim();
    if (!text) continue;
    const sender: NpcChatMessage['sender'] =
      role.includes('user') || role.includes('player') ? 'player' : 'npc';
    const emotion = (o.emotion as NpcEmotion | undefined) ?? (sender === 'npc' ? 'happy' : 'neutral');
    out.push({ id: newId(), text, emotion, sender });
  }
  return out;
}

export type GameApiPhase = 'idle' | 'loading' | 'playing' | 'error';

export interface GameApiContextValue {
  phase: GameApiPhase;
  error: string | null;
  sessionId: string | null;
  currentSceneId: string | null;
  scenarioId: string;
  userId: string;
  companionId: string;
  affinityScore: number;
  affinityLevel: string | null;
  objectives: ObjectiveDisplay[];
  clues: { id: string; title: string; description: string; time: string }[];
  log: GameMessage[];
  npcThread: NpcChatMessage[];
  clock: string;
  busy: boolean;
  busyLabel: string | null;
  setUserId: (v: string) => void;
  setScenarioId: (v: string) => void;
  startSession: () => Promise<void>;
  resetToIdle: () => void;
  investigateObject: (objectId: ScenarioObjectId) => Promise<void>;
  sendCommand: (text: string) => Promise<void>;
  sendNpcChat: (text: string) => Promise<void>;
  requestHint: () => Promise<void>;
}

const GameApiContext = createContext<GameApiContextValue | null>(null);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<GameApiPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const [userId, setUserId] = useState('test_user');
  const [companionId] = useState(DEFAULT_COMPANION_ID);
  const [objectives, setObjectives] = useState<ObjectiveDisplay[]>([]);
  const [affinityScore, setAffinityScore] = useState(50);
  const [affinityLevel, setAffinityLevel] = useState<string | null>(null);
  const [clues, setClues] = useState<{ id: string; title: string; description: string; time: string }[]>([]);
  const [log, setLog] = useState<GameMessage[]>([]);
  const [npcThread, setNpcThread] = useState<NpcChatMessage[]>([]);
  const [clock, setClock] = useState(INITIAL_CLOCK);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const playTimeRef = useRef(0);

  const sessionRef = useRef<string | null>(null);
  const sceneRef = useRef<string | null>(null);
  sessionRef.current = sessionId;
  sceneRef.current = currentSceneId;

  const refreshAffinity = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    try {
      const a = await getAffinity(sid, companionId);
      const score = a.affinity?.score;
      if (typeof score === 'number' && !Number.isNaN(score)) {
        setAffinityScore(Math.max(0, Math.min(100, score)));
      }
      setAffinityLevel(typeof a.affinity?.level === 'string' ? a.affinity.level : null);
    } catch {
      /* 호감도 조회 실패는 치명적이지 않음 */
    }
  }, [companionId]);

  const refreshClues = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    const raw = await getClues(sid);
    setClues(normalizeCluesResponse(raw));
  }, []);

  const refreshChat = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    const raw = await getChatHistory(sid, companionId);
    const thread = normalizeChatThread(raw);
    if (thread.length) setNpcThread(thread);
  }, [companionId]);

  const bumpAndLog = useCallback((text: string, type: GameMessage['type']) => {
    setClock((c) => {
      const next = bumpClock(c);
      setLog((prev) => pushLog(prev, next, text, type));
      return next;
    });
    playTimeRef.current += 1;
  }, []);

  const withBusy = useCallback(async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    setBusyLabel(label);
    try {
      await fn();
    } finally {
      setBusy(false);
      setBusyLabel(null);
    }
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    setPhase('loading');
    playTimeRef.current = 0;
    try {
      const data = await startGameSession({
        userId: userId.trim() || 'test_user',
        scenarioId: scenarioId.trim() || DEFAULT_SCENARIO_ID,
        difficulty: 'normal',
      });
      const sid = data.sessionId;
      const sceneId = data.startSceneId;
      setSessionId(sid);
      setCurrentSceneId(sceneId);
      sessionRef.current = sid;
      sceneRef.current = sceneId;

      const scene = await getScene(sceneId, sid);
      const objs = objectivesFromInitial(data.initialState?.objectives);
      setObjectives(objs.length ? objs : [{ id: 'goal', text: '목표 정보를 불러오지 못했습니다.', completed: false }]);

      setClock(INITIAL_CLOCK);
      const opening =
        pickText(scene, ['description', 'narration', 'intro']) ??
        '세션이 시작되었다. 주변 핫스팟을 눌러 조사하고, 아래 입력창으로 자유 행동을 시도할 수 있다.';
      setLog([{ id: newId(), text: opening, type: 'narration', timestamp: INITIAL_CLOCK }]);
      setNpcThread([
        { id: newId(), text: POLY_OPENING_LINE, emotion: 'happy', sender: 'npc' },
      ]);

      await refreshAffinity();
      await refreshClues();
      await refreshChat();

      setPhase('playing');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase('error');
    }
  }, [userId, scenarioId, refreshAffinity, refreshClues, refreshChat]);

  const resetToIdle = useCallback(() => {
    setPhase('idle');
    setError(null);
    setSessionId(null);
    setCurrentSceneId(null);
    setObjectives([]);
    setClues([]);
    setLog([]);
    setNpcThread([]);
    setAffinityScore(50);
    setAffinityLevel(null);
    setClock(INITIAL_CLOCK);
  }, []);

  const currentObjectiveId = useMemo(() => {
    const pending = objectives.find((o) => !o.completed);
    return pending?.id ?? objectives[objectives.length - 1]?.id ?? 'find_cabinet_password';
  }, [objectives]);

  const investigateObject = useCallback(
    async (objectId: ScenarioObjectId) => {
      const sid = sessionRef.current;
      const scid = sceneRef.current;
      if (!sid || !scid) return;

      const label = API_HOTSPOT_BY_SCENARIO_OBJECT[objectId];
      bumpAndLog(`${label ? `핫스팟 조사 (${objectId})` : `주변 조사 (${objectId})`}`, 'action');

      if (label) {
        try {
          const data = await postInteract({
            sessionId: sid,
            sceneId: scid,
            action: 'investigate',
            targetId: label,
          });
          const clue = data.discoveredClue;
          if (clue?.clueId) {
            const line = [clue.title, clue.description].filter(Boolean).join(' — ') || clue.clueId;
            bumpAndLog(`새 단서: ${line}`, 'narration');
          } else {
            bumpAndLog('조사가 완료되었으나 단서 형식을 해석하지 못했다.', 'narration');
          }
          await refreshClues();
        } catch (e) {
          const ge = e instanceof GameApiError ? e : null;
          if (ge?.status === 409) {
            bumpAndLog('이미 조사한 지점이다.', 'narration');
          } else {
            bumpAndLog(e instanceof Error ? e.message : String(e), 'narration');
          }
        }
        return;
      }

      await withBusy('내레이션 생성 중…', async () => {
        try {
          const res = await postAction({
            sessionId: sid,
            actionType: 'free_text',
            rawInput: `${objectId} 지점을 조사한다`,
          });
          const narration =
            pickText(res, [
              'narrative',
              'narration',
              'data.narrative',
              'text',
              'message',
              'response.text',
              'data.text',
            ]) ?? '내레이션을 받지 못했습니다.';
          bumpAndLog(narration, 'narration');
        } catch (err) {
          bumpAndLog(err instanceof Error ? err.message : String(err), 'narration');
        }
      });
    },
    [bumpAndLog, refreshClues, withBusy],
  );

  const tryClueUsePassword = useCallback(
    async (digits: string): Promise<boolean> => {
      const sid = sessionRef.current;
      if (!sid) return false;
      const clueIds = new Set(clues.map((c) => c.id));
      if (!clueIds.has('bloody_note') || !clueIds.has('cabinet_lock')) {
        return false;
      }
      try {
        const data = await postClueUse({
          sessionId: sid,
          clueId: 'bloody_note',
          targetId: 'cabinet_lock',
          inputValue: digits,
        });
        if (data.isCorrect) {
          bumpAndLog('자물쇠가 맞물리는 소리가 난다. 비밀번호가 맞았다.', 'narration');
          if (data.objectiveCompleted) {
            setObjectives((o) => mergeObjectiveCompletion(o, data.objectiveCompleted!));
          }
          try {
            await postAffinityEvent({
              sessionId: sid,
              companionId,
              eventType: 'solved_puzzle',
            });
          } catch {
            /* ignore */
          }
          await refreshAffinity();
          await refreshClues();
          try {
            await postSessionSave({
              sessionId: sid,
              currentSceneId: sceneRef.current ?? '',
              playTime: playTimeRef.current,
              autoSave: true,
            });
          } catch {
            /* ignore */
          }
          return true;
        }
        bumpAndLog('비밀번호가 맞지 않는다.', 'narration');
        return true;
      } catch (e) {
        bumpAndLog(e instanceof Error ? e.message : String(e), 'narration');
        return true;
      }
    },
    [bumpAndLog, clues, companionId, refreshAffinity, refreshClues],
  );

  const sendCommand = useCallback(
    async (text: string) => {
      const raw = text.trim();
      if (!raw) return;
      const sid = sessionRef.current;
      if (!sid) return;

      const runFreeAction = async () => {
        await withBusy('행동 처리 중…', async () => {
          try {
            const res = await postAction({
              sessionId: sid,
              actionType: 'free_text',
              rawInput: raw,
            });
            const narration =
              pickText(res, [
                'narrative',
                'narration',
                'data.narrative',
                'text',
                'message',
                'response.text',
                'data.text',
              ]) ?? '내레이션을 받지 못했습니다.';
            bumpAndLog(narration, 'narration');
          } catch (e) {
            bumpAndLog(e instanceof Error ? e.message : String(e), 'narration');
          }
        });
      };

      if (/^\d{4}$/.test(raw)) {
        bumpAndLog(raw, 'action');
        const handled = await tryClueUsePassword(raw);
        if (handled) return;
        await runFreeAction();
        return;
      }

      bumpAndLog(raw, 'action');
      await runFreeAction();
    },
    [bumpAndLog, tryClueUsePassword, withBusy],
  );

  const sendNpcChat = useCallback(
    async (text: string) => {
      const raw = text.trim();
      if (!raw) return;
      const sid = sessionRef.current;
      if (!sid) return;

      const emotion = mapAffinityLevelToEmotion(affinityLevel);
      setNpcThread((t) => [...t, { id: newId(), text: raw, emotion: 'neutral', sender: 'player' }]);
      bumpAndLog(`폴리에게: ${raw}`, 'action');

      await withBusy('동료 응답 생성 중…', async () => {
        try {
          const res = await postCompanionChat({
            sessionId: sid,
            companionId,
            message: raw,
          });
          const reply =
            pickText(res, [
              'companionResponse.text',
              'response.text',
              'text',
              'message',
              'reply',
            ]) ?? '…';
          const deltaEmotion = mapAffinityLevelToEmotion(
            pickText(res, ['companionReaction.mood', 'mood']) ?? affinityLevel,
          );
          setNpcThread((t) => [
            ...t,
            { id: newId(), text: reply, emotion: deltaEmotion, sender: 'npc' },
          ]);
          bumpAndLog(`폴리: “${reply}”`, 'narration');
          await refreshAffinity();
          await refreshChat();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setNpcThread((t) => [...t, { id: newId(), text: msg, emotion: 'sad', sender: 'npc' }]);
        }
      });
    },
    [affinityLevel, bumpAndLog, companionId, refreshAffinity, refreshChat, withBusy],
  );

  const requestHint = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    await withBusy('힌트 생성 중…', async () => {
      try {
        const res = await postCompanionHint({
          sessionId: sid,
          companionId,
          currentObjectiveId: currentObjectiveId,
        });
        const hint =
          pickText(res, ['hintText', 'data.hintText']) ?? '힌트 텍스트를 받지 못했습니다.';
        bumpAndLog(`힌트: ${hint}`, 'narration');
        setNpcThread((t) => [
          ...t,
          { id: newId(), text: `(힌트) ${hint}`, emotion: 'curious', sender: 'npc' },
        ]);
        await refreshAffinity();
      } catch (e) {
        bumpAndLog(e instanceof Error ? e.message : String(e), 'narration');
      }
    });
  }, [bumpAndLog, companionId, currentObjectiveId, refreshAffinity, withBusy]);

  const value = useMemo<GameApiContextValue>(
    () => ({
      phase,
      error,
      sessionId,
      currentSceneId,
      scenarioId,
      userId,
      companionId,
      affinityScore,
      affinityLevel,
      objectives,
      clues,
      log,
      npcThread,
      clock,
      busy,
      busyLabel,
      setUserId,
      setScenarioId,
      startSession,
      resetToIdle,
      investigateObject,
      sendCommand,
      sendNpcChat,
      requestHint,
    }),
    [
      affinityLevel,
      affinityScore,
      busy,
      busyLabel,
      clock,
      clues,
      companionId,
      currentSceneId,
      error,
      investigateObject,
      log,
      npcThread,
      objectives,
      phase,
      requestHint,
      resetToIdle,
      scenarioId,
      sendCommand,
      sendNpcChat,
      sessionId,
      startSession,
      userId,
    ],
  );

  return <GameApiContext.Provider value={value}>{children}</GameApiContext.Provider>;
}

export function useGameApi(): GameApiContextValue {
  const ctx = useContext(GameApiContext);
  if (!ctx) {
    throw new Error('useGameApi는 GameApiProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}

export function useOptionalGameApi(): GameApiContextValue | null {
  return useContext(GameApiContext);
}
