import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DoorOpen, Lock, Maximize2, Search } from 'lucide-react';
import hoverSoundUrl from '@/music/miraclei-sample_hover_subtle04_kofi_by_miraclei-364171.mp3';
import { ROOM_TITLE, SCENARIO_OBJECTS } from '@/game/scenario';
import type { SceneViewState } from '@/lib/sceneView';

const FALLBACK_BG =
  'url(https://images.unsplash.com/photo-1701988571136-a48405491706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwaG9zcGl0YWwlMjByb29tJTIwZXNjYXBlJTIwZ2FtZSUyMG15c3Rlcnl8ZW58MXx8fHwxNzc4MjUxODgwfDA&ixlib=rb-4.1.0&q=80&w=1080)';

interface GameRoomProps {
  onInvestigate: (id: string) => void;
  /** API `getScene` 기반 오버레이. 없으면 로컬 시나리오 `SCENARIO_OBJECTS` 사용 */
  sceneView?: SceneViewState | null;
  onSceneExit?: (exitId: string) => void;
  /** API 요청 등으로 입력을 막을 때 */
  disabled?: boolean;
}

export default function GameRoom({ onInvestigate, sceneView, onSceneExit, disabled }: GameRoomProps) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);

  const playHoverSound = useCallback(() => {
    if (!hoverAudioRef.current) {
      const audio = new Audio(hoverSoundUrl);
      audio.preload = 'auto';
      hoverAudioRef.current = audio;
    }
    const audio = hoverAudioRef.current;
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, []);

  const bgStyle = sceneView?.backgroundImageUrl
    ? `url(${sceneView.backgroundImageUrl})`
    : FALLBACK_BG;

  const roomTitle = sceneView?.title ?? ROOM_TITLE;
  const roomSubtitle = sceneView?.description ?? '공간을 조사하여 탈출 방법을 찾으세요';

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: bgStyle,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />

      <div className={`absolute inset-0 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {sceneView ? (
          <>
            {sceneView.hotspots.map((object) => (
              <motion.div
                key={object.id}
                className={`absolute cursor-pointer group ${object.isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                style={{
                  left: `${object.x}%`,
                  top: `${object.y}%`,
                  width: `${object.size}px`,
                  height: `${object.size}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                onHoverStart={() => {
                  if (object.isLocked) return;
                  setHoveredObject(object.id);
                  playHoverSound();
                }}
                onHoverEnd={() => setHoveredObject(null)}
                onClick={() => {
                  if (disabled || object.isLocked) return;
                  onInvestigate(object.id);
                }}
                whileHover={object.isLocked ? undefined : { scale: 1.05 }}
                animate={{
                  opacity: hoveredObject === object.id ? 1 : object.isInvestigated ? 0.55 : 0.85,
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl"
                  animate={{
                    opacity: hoveredObject === object.id ? 0.8 : 0,
                    scale: hoveredObject === object.id ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />

                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {object.isInvestigated ? (
                      <Search className="w-6 h-6 text-zinc-400/80" />
                    ) : hoveredObject === object.id ? (
                      <Maximize2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    ) : (
                      <Search className="w-6 h-6 text-cyan-300/60 group-hover:text-cyan-400" />
                    )}
                  </div>
                </div>

                <motion.div
                  className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{
                    opacity: hoveredObject === object.id ? 1 : 0,
                    y: hoveredObject === object.id ? 0 : -5,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-lg border border-cyan-400/30 bg-black/90 px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-sm font-medium text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                      {object.label}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {sceneView.exits.map((exit) => (
              <motion.button
                key={exit.id}
                type="button"
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-amber-500/40 bg-black/75 px-3 py-2 text-left shadow-lg backdrop-blur-sm transition hover:border-amber-400/70 hover:bg-black/85"
                style={{
                  left: `${exit.xPercent}%`,
                  top: `${exit.yPercent}%`,
                }}
                onMouseEnter={() => playHoverSound()}
                onClick={() => {
                  if (disabled) return;
                  onSceneExit?.(exit.id);
                }}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-200">
                  {exit.isLocked ? (
                    <Lock className="size-3.5 shrink-0 text-amber-400/90" />
                  ) : (
                    <DoorOpen className="size-3.5 shrink-0 text-amber-300/90" />
                  )}
                  {exit.label}
                </span>
                {exit.targetSceneId ? (
                  <span className="max-w-[10rem] truncate font-mono text-[10px] text-zinc-500">{exit.targetSceneId}</span>
                ) : null}
              </motion.button>
            ))}
          </>
        ) : (
          SCENARIO_OBJECTS.map((object) => (
            <motion.div
              key={object.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${object.x}%`,
                top: `${object.y}%`,
                width: `${object.size}px`,
                height: `${object.size}px`,
              }}
              onHoverStart={() => {
                setHoveredObject(object.id);
                playHoverSound();
              }}
              onHoverEnd={() => setHoveredObject(null)}
              onClick={() => {
                if (disabled) return;
                onInvestigate(object.id);
              }}
              whileHover={{ scale: 1.05 }}
              animate={{
                opacity: hoveredObject === object.id ? 1 : 0.8,
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl"
                animate={{
                  opacity: hoveredObject === object.id ? 0.8 : 0,
                  scale: hoveredObject === object.id ? 1.2 : 1,
                }}
                transition={{ duration: 0.3 }}
              />

              <motion.div
                className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {hoveredObject === object.id ? (
                    <Maximize2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  ) : (
                    <Search className="w-6 h-6 text-cyan-300/60 group-hover:text-cyan-400" />
                  )}
                </div>
              </div>

              <motion.div
                className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0, y: -5 }}
                animate={{
                  opacity: hoveredObject === object.id ? 1 : 0,
                  y: hoveredObject === object.id ? 0 : -5,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-lg border border-cyan-400/30 bg-black/90 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-sm font-medium text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                    {object.name}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          ))
        )}
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-wider text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            {roomTitle}
          </h2>
          <p className="mt-1 text-sm text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">{roomSubtitle}</p>
        </motion.div>
      </div>
    </div>
  );
}
