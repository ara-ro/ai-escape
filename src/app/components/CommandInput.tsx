import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Zap } from 'lucide-react';

export default function CommandInput() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('Command:', input);
      setInput('');
    }
  };

  const quickActions = [
    { id: '1', text: '약장 조사하기', icon: '🔍' },
    { id: '2', text: '문 열어보기', icon: '🚪' },
    { id: '3', text: '시계 확인하기', icon: '🕐' },
  ];

  return (
    <div className="bg-black/60 backdrop-blur-md border-t border-cyan-400/20 p-4">
      {/* Quick Actions */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-gray-400 text-xs">빠른 행동</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/40 hover:border-cyan-400/40 rounded-lg text-gray-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>{action.icon}</span>
              <span>{action.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          className="relative"
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(34, 211, 238, 0.3)'
              : '0 0 0px rgba(34, 211, 238, 0)',
          }}
          transition={{ duration: 0.3 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="무엇을 하시겠습니까? (예: 약장을 조사한다)"
            className="w-full bg-gray-900/80 backdrop-blur-sm border-2 border-cyan-400/30 focus:border-cyan-400/60 rounded-xl px-4 py-3 pr-12 text-gray-100 placeholder-gray-500 outline-none transition-colors"
          />

          {/* Animated Border Effect */}
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/40 animate-pulse" />
            </motion.div>
          )}

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!input.trim()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              input.trim()
                ? 'bg-cyan-500/80 hover:bg-cyan-500 text-white'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Typing Indicator */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            height: isFocused ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
          className="mt-2 flex items-center gap-2 text-xs text-gray-500 overflow-hidden"
        >
          <div className="flex gap-1">
            <motion.div
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span>자연어로 행동을 입력하세요</span>
        </motion.div>
      </form>
    </div>
  );
}
