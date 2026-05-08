import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, GripHorizontal, Terminal } from 'lucide-react';
import type { GameMessage } from '@/game/types';

const DEFAULT_CONTENT_HEIGHT = 192;
const MIN_CONTENT_HEIGHT = 72;
const MAX_CONTENT_HEIGHT_RATIO = 0.65;

interface GameLogProps {
  messages: GameMessage[];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function GameLog({ messages }: GameLogProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [contentHeightPx, setContentHeightPx] = useState(DEFAULT_CONTENT_HEIGHT);
  const [resizeHover, setResizeHover] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = logScrollRef.current;
    if (!el || collapsed) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, collapsed]);

  const maxContentHeight =
    typeof window !== 'undefined' ? window.innerHeight * MAX_CONTENT_HEIGHT_RATIO : 480;

  const onResizeMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const maxH = window.innerHeight * MAX_CONTENT_HEIGHT_RATIO;
    const delta = drag.startY - e.clientY;
    setContentHeightPx(clamp(drag.startHeight + delta, MIN_CONTENT_HEIGHT, maxH));
  }, []);

  const endResize = useCallback(() => {
    dragRef.current = null;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', endResize);
  }, [onResizeMove]);

  const startResize = useCallback(
    (e: ReactMouseEvent) => {
      if (collapsed) return;
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startHeight: contentHeightPx };
      setIsResizing(true);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', endResize);
    },
    [collapsed, contentHeightPx, endResize, onResizeMove],
  );

  useEffect(() => {
    return () => endResize();
  }, [endResize]);

  return (
    <div className="absolute bottom-0 left-0 right-0 max-w-2xl mx-auto pointer-events-none flex flex-col items-stretch">
      <div className="relative pointer-events-auto rounded-t-lg overflow-hidden">
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="로그 영역 높이 조절"
            onMouseDown={startResize}
            onMouseEnter={() => setResizeHover(true)}
            onMouseLeave={() => {
              if (!isResizing) setResizeHover(false);
            }}
            className={[
              'group flex h-3 shrink-0 cursor-ns-resize items-center justify-center rounded-t-md border-x border-t border-cyan-400/25 bg-black/50 transition-colors',
              resizeHover || isResizing ? 'border-cyan-400/45 bg-cyan-950/40' : 'hover:border-cyan-400/40 hover:bg-cyan-950/30',
            ].join(' ')}
          >
            <GripHorizontal
              className={[
                'h-3.5 w-8 text-cyan-500/50 transition-opacity',
                resizeHover || isResizing ? 'text-cyan-400/90 opacity-100' : 'opacity-0 group-hover:opacity-100',
              ].join(' ')}
            />
          </div>
        )}

        <div
          className={[
            'bg-black/60 backdrop-blur-md border border-cyan-400/20 overflow-hidden shadow-lg',
            collapsed ? 'rounded-lg' : 'rounded-b-lg border-t-0 rounded-t-none',
          ].join(' ')}
        >
          <div className="px-3 py-2 border-b border-cyan-400/20 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-cyan-300 text-xs font-semibold flex-1 min-w-0">게임 로그</span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                disabled={collapsed}
                className="p-1 rounded text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-30 disabled:pointer-events-none"
                title="축소"
                aria-label="게임 로그 축소"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                disabled={!collapsed}
                className="p-1 rounded text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-30 disabled:pointer-events-none"
                title="확대"
                aria-label="게임 로그 확대"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!collapsed && (
            <div
              ref={logScrollRef}
              className="overflow-y-auto p-3 space-y-2 min-h-0"
              style={{ height: contentHeightPx, maxHeight: maxContentHeight }}
            >
              <AnimatePresence>
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-xs text-center py-4">아직 행동 기록이 없습니다</div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`text-xs leading-relaxed whitespace-pre-wrap ${
                        message.type === 'action' ? 'text-cyan-300' : 'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500 mr-2">{message.timestamp}</span>
                      {message.type === 'action' && <span className="text-cyan-400 mr-1">▶</span>}
                      {message.text}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
