import { useCallback, useMemo, useState } from 'react';
import GameRoom from './components/GameRoom';
import CluesPanel from './components/CluesPanel';
import NPCPanel from './components/NPCPanel';
import CommandInput from './components/CommandInput';
import GameHUD from './components/GameHUD';
import GameLog from './components/GameLog';
import { createInitialState, reduceGame } from '@/game';
import type { GameMessage, ScenarioObjectId } from '@/game/types';
import { HUD_LOCATION } from '@/game/scenario';
import { selectDiscoveredClues, selectObjectives, selectProgressPercent } from './selectors';
import ApiTestPanel from './components/ApiTestPanel';
import { GameApiProvider, useGameApi } from './GameApiContext';

const showApiTest = false;

const apiQuickActions = [
  { id: 'a1', text: '복도 끝 표지 주변을 조사한다', icon: '🔍' },
  { id: 'a2', text: '약장과 자물쇠를 살펴본다', icon: '🧩' },
  { id: 'a3', text: '3729', icon: '🔢' },
] as const;

function LocalDemoApp() {
  const [isCluesPanelOpen, setIsCluesPanelOpen] = useState(true);
  const [isNPCPanelOpen, setIsNPCPanelOpen] = useState(true);
  const [gameState, setGameState] = useState(createInitialState);

  const messages: GameMessage[] = gameState.log;

  const dispatchCommand = useCallback((text: string) => {
    setGameState((s) => reduceGame(s, { kind: 'command', text }));
  }, []);

  const dispatchInvestigate = useCallback((objectId: ScenarioObjectId) => {
    setGameState((s) => reduceGame(s, { kind: 'investigate', objectId }));
  }, []);

  const dispatchNpcChat = useCallback((text: string) => {
    setGameState((s) => reduceGame(s, { kind: 'npc_chat', text }));
  }, []);

  return (
    <div className="size-full bg-black overflow-hidden">
      {showApiTest ? <ApiTestPanel /> : null}
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <CluesPanel
            isOpen={isCluesPanelOpen}
            onToggle={() => setIsCluesPanelOpen(!isCluesPanelOpen)}
            inventory={gameState.inventory}
            clues={selectDiscoveredClues(gameState)}
            objectives={selectObjectives(gameState)}
            progressPercent={selectProgressPercent(gameState)}
          />

          <div className="flex-1 relative">
            <GameRoom onInvestigate={(id) => dispatchInvestigate(id as ScenarioObjectId)} />
            <GameHUD gameTime={gameState.clock} location={HUD_LOCATION} />
            <GameLog messages={messages} />
          </div>

          <NPCPanel
            isOpen={isNPCPanelOpen}
            onToggle={() => setIsNPCPanelOpen(!isNPCPanelOpen)}
            messages={gameState.npcThread}
            affection={gameState.polyAffection}
            onNpcMessage={dispatchNpcChat}
          />
        </div>

        <div className="flex-shrink-0">
          <CommandInput onSendMessage={dispatchCommand} />
          <div className="border-t border-zinc-800/80 bg-zinc-950/50 px-3 py-1 text-center">
            <button
              type="button"
              className="text-[11px] text-zinc-500 underline hover:text-zinc-300"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
            >
              서버(API) 모드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiConnectedApp() {
  const api = useGameApi();
  const [isCluesPanelOpen, setIsCluesPanelOpen] = useState(true);
  const [isNPCPanelOpen, setIsNPCPanelOpen] = useState(true);

  const progressPercent = useMemo(() => {
    const o = api.objectives;
    if (!o.length) return 0;
    return Math.round((o.filter((x) => x.completed).length / o.length) * 100);
  }, [api.objectives]);

  if (api.phase === 'idle' || api.phase === 'error') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-black px-6 py-16 text-center">
        {showApiTest ? <ApiTestPanel /> : null}
        <div>
          <h1 className="text-2xl font-semibold text-cyan-200">AI 방탈출 — 서버 세션</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            `docs/API_FLOW.md` 순서대로 세션을 시작한 뒤 씬·조사·동료·힌트 API가 UI에 연결됩니다.
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3 text-left">
          <label className="text-xs text-zinc-500">userId</label>
          <input
            value={api.userId}
            onChange={(e) => api.setUserId(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <label className="text-xs text-zinc-500">scenarioId</label>
          <input
            value={api.scenarioId}
            onChange={(e) => api.setScenarioId(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          {api.error ? (
            <p className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {api.error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void api.startSession()}
            className="rounded-lg bg-cyan-700 px-4 py-3 text-sm font-medium text-white hover:bg-cyan-600"
          >
            게임 시작 (POST session/start)
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = 'local-demo';
              window.location.reload();
            }}
            className="text-xs text-zinc-500 underline decoration-zinc-600 hover:text-zinc-300"
          >
            로컬 데모만 보기
          </button>
        </div>
      </div>
    );
  }

  if (api.phase === 'loading') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-black text-zinc-300">
        {showApiTest ? <ApiTestPanel /> : null}
        <p className="text-sm">세션을 여는 중…</p>
      </div>
    );
  }

  return (
    <div className="size-full bg-black overflow-hidden">
      {showApiTest ? <ApiTestPanel /> : null}
      {api.busy ? (
        <div className="pointer-events-none fixed inset-0 z-[150] flex items-end justify-center pb-28">
          <div className="rounded-lg border border-cyan-500/30 bg-black/80 px-4 py-2 text-xs text-cyan-200 backdrop-blur">
            {api.busyLabel ?? '처리 중…'}
          </div>
        </div>
      ) : null}
      <div className="h-full flex flex-col">
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-[11px] text-zinc-400">
          <span className="truncate font-mono text-zinc-500">
            session: {api.sessionId?.slice(0, 12)}… · scene: {api.currentSceneId}
          </span>
          <button
            type="button"
            onClick={() => api.resetToIdle()}
            className="rounded border border-zinc-600 px-2 py-0.5 text-zinc-300 hover:bg-zinc-800"
          >
            나가기
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <CluesPanel
            isOpen={isCluesPanelOpen}
            onToggle={() => setIsCluesPanelOpen(!isCluesPanelOpen)}
            clues={api.clues}
            objectives={api.objectives}
            progressPercent={progressPercent}
          />

          <div className="relative flex-1">
            <GameRoom
              disabled={api.busy}
              sceneView={api.sceneView}
              onInvestigate={(id) => void api.investigateObject(id)}
              onSceneExit={(id) => void api.handleSceneExit(id)}
            />
            <GameHUD
              gameTime={api.clock}
              location={api.currentSceneId ? `씬: ${api.currentSceneId}` : HUD_LOCATION}
            />
            <GameLog messages={api.log} />
          </div>

          <NPCPanel
            isOpen={isNPCPanelOpen}
            onToggle={() => setIsNPCPanelOpen(!isNPCPanelOpen)}
            messages={api.npcThread}
            affection={api.affinityScore}
            onNpcMessage={(t) => void api.sendNpcChat(t)}
            onRequestHint={() => void api.requestHint()}
            hintDisabled={api.busy}
            hintLoading={Boolean(api.busy && api.busyLabel?.includes('힌트'))}
          />
        </div>
        <div className="flex-shrink-0">
          <CommandInput
            disabled={api.busy}
            quickActions={[...apiQuickActions]}
            onSendMessage={(m) => void api.sendCommand(m)}
          />
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash === '#local-demo') {
    return <LocalDemoApp />;
  }
  return (
    <GameApiProvider>
      <ApiConnectedApp />
    </GameApiProvider>
  );
}

export default function App() {
  return <AppRouter />;
}
