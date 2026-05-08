import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'curious';
  role: 'npc' | 'user';
}

/** 추후 AI API 호출로 교체: 사용자 문장 → NPC 답변 텍스트·감정 */
async function requestNpcReply(userMessage: string): Promise<Pick<Message, 'text' | 'emotion'>> {
  await new Promise((r) => setTimeout(r, 500));
  return {
    text:
      userMessage.trim().length > 0
        ? `「${userMessage.slice(0, 80)}${userMessage.length > 80 ? '…' : ''}」… 음, 일단 여기까지는 샘플 응답이야. API 붙이면 진짜 대화가 될 거야!`
        : '…말이 비었어. 다시 말해줄래?',
    emotion: 'curious',
  };
}

interface NPCPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function NPCPanel({ isOpen, onToggle }: NPCPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '여기서 나가려면... 힌트가 필요하겠지?',
      emotion: 'curious',
      role: 'npc',
    },
    {
      id: '2',
      text: '약장 비밀번호는 이 방 어딘가에 있어. 잘 찾아봐!',
      emotion: 'happy',
      role: 'npc',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendPlayerMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    const userId = `u-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, text: trimmed, emotion: 'neutral', role: 'user' },
    ]);
    setDraft('');
    setIsSending(true);

    try {
      const reply = await requestNpcReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `n-${Date.now()}`,
          text: reply.text,
          emotion: reply.emotion,
          role: 'npc',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending]);

  const affection = 65;
  const emotion = 'curious';

  const emotionColors = {
    neutral: 'text-gray-400',
    happy: 'text-yellow-400',
    sad: 'text-blue-400',
    curious: 'text-purple-400',
  };

  const emotionEmojis = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    curious: '🤔',
  };

  return (
    <div className="h-full relative flex">
      {/* Toggle Button */}
      <button
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
            {/* NPC Header */}
            <div className="p-4 border-b border-cyan-400/20">
              <h3 className="text-cyan-300 font-bold text-lg flex items-center gap-2 mb-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                <Sparkles className="w-5 h-5" />
                동료
              </h3>

              {/* Parrot Character */}
              <motion.div
                className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border-2 border-cyan-400/30 mb-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
          <img
            src="https://images.unsplash.com/photo-1713022646048-ac4b541c9d85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxwYXJyb3QlMjBiaXJkJTIwcG9ydHJhaXQlMjBjaGFyYWN0ZXJ8ZW58MXx8fHwxNzc4MjUxODgwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="AI Parrot"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Emotion Indicator */}
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

          {/* Name Tag */}
          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-400/30">
            <span className="text-cyan-300 font-semibold text-sm">폴리</span>
            <span className="text-gray-400 text-xs ml-2">앵무새 동료</span>
          </div>
        </motion.div>

        {/* Affection Meter */}
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
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Dialogue Box */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-semibold">대화</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] backdrop-blur-sm p-3 rounded-lg border text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-cyan-950/50 border-cyan-400/35 text-cyan-100'
                      : 'bg-gray-900/60 border-purple-400/20 text-gray-300'
                  }`}
                >
                  {message.role === 'npc' ? (
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5 shrink-0">
                        {emotionEmojis[message.emotion]}
                      </span>
                      <motion.p
                        className="flex-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.1 }}
                      >
                        {message.text}
                      </motion.p>
                    </div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      {message.text}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NPC 대화 입력 — `requestNpcReply`를 AI API 호출로 교체하면 됨 */}
      <div className="p-3 border-t border-cyan-400/20 shrink-0 bg-black/20">
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendPlayerMessage();
              }
            }}
            placeholder="폴리에게 말 걸기…"
            rows={2}
            disabled={isSending}
            className="flex-1 min-h-[2.75rem] max-h-28 resize-y rounded-lg bg-gray-950/80 border border-cyan-400/25 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void sendPlayerMessage()}
            disabled={isSending || !draft.trim()}
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="보내기"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-600 leading-tight">
          Enter 전송 · Shift+Enter 줄바꿈
        </p>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
