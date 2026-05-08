import { useCallback, useState } from 'react';
import { startGameSession } from '@/lib/gameApi';

const DOCS_URL = 'http://192.168.201.184:5000/docs';

export default function ApiTestPanel() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('local-dev');
  const [scenarioId, setScenarioId] = useState('hospital');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await startGameSession({ userId: userId.trim(), scenarioId: scenarioId.trim() });
      const payload = r.json ?? r.rawText;
      setResult(JSON.stringify({ httpStatus: r.status, body: payload }, null, 2));
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }, [userId, scenarioId]);

  return (
    <div className="pointer-events-auto fixed bottom-20 left-3 z-[200] text-left text-xs text-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-zinc-600 bg-zinc-900/95 px-2 py-1 font-medium text-zinc-100 shadow hover:bg-zinc-800"
      >
        API 테스트
      </button>
      {open ? (
        <div className="mt-2 w-[min(100vw-1.5rem,22rem)] rounded border border-zinc-600 bg-zinc-950/95 p-3 shadow-lg backdrop-blur">
          <p className="mb-2 text-[11px] leading-snug text-zinc-400">
            개발 서버는 Vite가 <code className="text-zinc-300">/api</code>를 백엔드로 프록시합니다.{' '}
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-amber-400 underline">
              Swagger
            </a>
          </p>
          <label className="mb-1 block text-zinc-500">userId</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mb-2 w-full rounded border border-zinc-700 bg-black px-2 py-1 text-zinc-100"
          />
          <label className="mb-1 block text-zinc-500">scenarioId</label>
          <input
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="mb-2 w-full rounded border border-zinc-700 bg-black px-2 py-1 text-zinc-100"
          />
          <button
            type="button"
            disabled={loading || !userId.trim() || !scenarioId.trim()}
            onClick={() => void runTest()}
            className="mb-2 w-full rounded bg-amber-700 px-2 py-1.5 font-medium text-white disabled:opacity-40"
          >
            {loading ? '요청 중…' : 'POST /api/game/session/start'}
          </button>
          {result ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-zinc-800 bg-black/80 p-2 text-[10px] text-zinc-300">
              {result}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
