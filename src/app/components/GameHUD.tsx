import { motion } from 'motion/react';
import { Clock, Map, Volume2, Settings } from 'lucide-react';

export default function GameHUD() {
  const gameTime = '23:47';
  const location = '폐쇄된 병동 3층';

  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-start justify-between p-4">
          {/* Left: Time & Location */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2 pointer-events-auto"
          >
            <div className="bg-black/60 backdrop-blur-md border border-cyan-400/30 rounded-lg px-4 py-2 flex items-center gap-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-mono text-sm font-semibold">
                {gameTime}
              </span>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-purple-400/30 rounded-lg px-4 py-2 flex items-center gap-3">
              <Map className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">
                {location}
              </span>
            </div>
          </motion.div>

          {/* Right: Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-2 pointer-events-auto"
          >
            <button className="bg-black/60 backdrop-blur-md border border-cyan-400/30 rounded-lg p-2 hover:bg-black/80 transition-colors group">
              <Volume2 className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
            <button className="bg-black/60 backdrop-blur-md border border-cyan-400/30 rounded-lg p-2 hover:bg-black/80 transition-colors group">
              <Settings className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          }}
          animate={{
            y: ['0%', '100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Corner Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/40" />
        {/* Top Right */}
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/40" />
        {/* Bottom Left */}
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40" />
        {/* Bottom Right */}
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40" />
      </div>
    </>
  );
}
