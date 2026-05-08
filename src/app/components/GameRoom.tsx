import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Maximize2, Search } from 'lucide-react';
import hoverSoundUrl from '@/music/miraclei-sample_hover_subtle04_kofi_by_miraclei-364171.mp3';
import { ROOM_TITLE, SCENARIO_OBJECTS } from '@/game/scenario';
import type { ScenarioObjectId } from '@/game/types';

interface GameRoomProps {
  onInvestigate: (objectId: ScenarioObjectId) => void;
  /** API 요청 등으로 입력을 막을 때 */
  disabled?: boolean;
}

export default function GameRoom({ onInvestigate, disabled }: GameRoomProps) {
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1701988571136-a48405491706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwaG9zcGl0YWwlMjByb29tJTIwZXNjYXBlJTIwZ2FtZSUyMG15c3Rlcnl8ZW58MXx8fHwxNzc4MjUxODgwfDA&ixlib=rb-4.1.0&q=80&w=1080)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      <div className={`absolute inset-0 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {SCENARIO_OBJECTS.map((object) => (
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
              onInvestigate(object.id as ScenarioObjectId);
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
              initial={{ opacity: 0, y: -5 }}
              animate={{
                opacity: hoveredObject === object.id ? 1 : 0,
                y: hoveredObject === object.id ? 0 : -5,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-400/30">
                <span className="text-cyan-300 text-sm font-medium drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                  {object.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] tracking-wider">
            {ROOM_TITLE}
          </h2>
          <p className="text-cyan-400 text-sm mt-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
            공간을 조사하여 탈출 방법을 찾으세요
          </p>
        </motion.div>
      </div>
    </div>
  );
}
