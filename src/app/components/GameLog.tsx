import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from 'lucide-react';

interface GameMessage {
  id: string;
  text: string;
  type: 'action' | 'system' | 'narration';
  timestamp: string;
}

interface GameLogProps {
  messages: GameMessage[];
}

export default function GameLog({ messages }: GameLogProps) {
  return (
    <div className="absolute bottom-24 left-4 right-4 max-w-2xl mx-auto pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md border border-cyan-400/20 rounded-lg overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="px-3 py-2 border-b border-cyan-400/20 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-semibold">게임 로그</span>
        </div>

        {/* Messages */}
        <div className="max-h-48 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {messages.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">
                아직 행동 기록이 없습니다
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-xs leading-relaxed ${
                    message.type === 'action'
                      ? 'text-cyan-300'
                      : message.type === 'system'
                      ? 'text-yellow-300'
                      : 'text-gray-300'
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
      </div>
    </div>
  );
}
