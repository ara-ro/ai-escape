import { useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Sparkles, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import type { NpcChatMessage, NpcEmotion } from '@/game/types';
import polyBasic from '@/image/img-poly-basic.png';
import polyCrazy from '@/image/img-poly-crazy.png';
import polyDark from '@/image/img-poly-dark.png';
import polyMad from '@/image/img-poly-mad.png';
import polyMad2 from '@/image/img-poly-mad2.png';
import polySad from '@/image/img-poly-sad.png';
import polyThink from '@/image/img-poly-think.png';
import polyWondering from '@/image/img-poly-wondering.png';

/** 마지막 NPC 감정 + 호감도로 폴리 초상 8종 중 하나를 고릅니다. */
function polyPortraitSrc(emotion: NpcEmotion, affection: number): string {
  if (affection >= 40) {
    switch (emotion) {
      case 'neutral':
        return polyBasic;
      case 'happy':
        return polyWondering;
      case 'sad':
        return polySad;
      case 'curious':
        return polyThink;
    }
  }
  if (affection >= 20) {
    switch (emotion) {
      case 'neutral':
        return polyMad;
      case 'happy':
        return polyBasic;
      case 'sad':
        return polyMad2;
      case 'curious':
        return polyWondering;
    }
  }
  switch (emotion) {
    case 'neutral':
      return polyMad2;
    case 'happy':
      return polyCrazy;
    case 'sad':
      return polyDark;
    case 'curious':
      return polyMad;
    default: {
      const _exhaustive: never = emotion;
      return _exhaustive;
    }
  }
}

interface NPCPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: NpcChatMessage[];
  affection: number;
  onNpcMessage: (text: string) => void;
}

export default function NPCPanel({
  isOpen,
  onToggle,
  messages,
  affection,
  onNpcMessage,
}: NPCPanelProps) {
  const [input, setInput] = useState('');
  const threadScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = threadScrollRef.current;
    if (!el || !isOpen) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);
  const lastNpc = [...messages].reverse().find((m) => m.sender === 'npc');
  const emotion: NpcEmotion = lastNpc?.emotion ?? 'happy';
  const polySrc = polyPortraitSrc(emotion, affection);

  const emotionEmojis: Record<NpcEmotion, string> = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    curious: '🤔',
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onNpcMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="h-full relative flex">
      <button
        type="button"
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-black/60 backdrop-blur-md border border-cyan-400/30 border-r-0 rounded-l-lg p-2 hover:bg-black/80 transition-colors z-10"
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-cyan-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full bg-black/40 backdrop-blur-md border-l border-cyan-400/20 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-cyan-400/20">
              <h3 className="text-cyan-300 font-bold text-lg flex items-center gap-2 mb-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                <Sparkles className="w-5 h-5" />
                동료
              </h3>

              <motion.div
                className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-cyan-400/30 mb-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={polySrc}
                  alt="앵무새 폴리"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <motion.div
                  className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-400/40"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(168, 85, 247, 0.4)',
                      '0 0 20px rgba(168, 85, 247, 0.6)',
                      '0 0 10px rgba(168, 85, 247, 0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xl">{emotionEmojis[emotion]}</span>
                </motion.div>

                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-400/30">
                  <span className="text-cyan-300 font-semibold text-sm">폴리</span>
                  <span className="text-gray-400 text-xs ml-2">앵무새 동료</span>
                </div>
              </motion.div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-gray-400 text-xs">호감도</span>
                  </div>
                  <span className="text-pink-400 text-sm font-semibold">{affection}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${affection}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            <div ref={threadScrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-semibold">대화</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: message.sender === 'player' ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-3 rounded-lg ${
                        message.sender === 'player'
                          ? 'bg-cyan-900/40 backdrop-blur-sm border border-cyan-400/30 ml-4'
                          : 'bg-gray-900/60 backdrop-blur-sm border border-purple-400/20 mr-4'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender === 'npc' && (
                          <span className="text-lg mt-0.5">{emotionEmojis[message.emotion]}</span>
                        )}
                        <div className="flex-1">
                          {message.sender === 'player' && (
                            <span className="text-cyan-400 text-xs font-semibold mb-1 block">나</span>
                          )}
                          <motion.p
                            className={`text-sm leading-relaxed whitespace-pre-wrap ${
                              message.sender === 'player' ? 'text-gray-200' : 'text-gray-300'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 + 0.1 }}
                          >
                            {message.text}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-4 border-t border-cyan-400/20">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="폴리와 대화하기..."
                  className="w-full bg-gray-900/60 backdrop-blur-sm border border-cyan-400/30 focus:border-cyan-400/60 rounded-lg px-3 py-2 pr-10 text-gray-100 text-sm placeholder-gray-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    input.trim()
                      ? 'bg-cyan-500/80 hover:bg-cyan-500 text-white'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
