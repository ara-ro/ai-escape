import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Sparkles } from 'lucide-react';

interface EscapeCelebrationOverlayProps {
  open: boolean;
  onDismiss: () => void;
}

export default function EscapeCelebrationOverlay({ open, onDismiss }: EscapeCelebrationOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="escape-celebration-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="escape-success-title"
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative max-w-md overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-8 py-10 text-center shadow-[0_0_60px_rgba(52,211,153,0.25)]"
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 text-emerald-400/20">
              <Sparkles className="size-32" strokeWidth={1} />
            </div>
            <div className="pointer-events-none absolute -bottom-6 -left-6 text-cyan-400/15">
              <PartyPopper className="size-28" strokeWidth={1} />
            </div>

            <motion.div
              className="mb-4 flex justify-center"
              initial={{ rotate: -8, scale: 0 }}
              animate={{ rotate: [0, -6, 6, 0], scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 12 }}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/50">
                <PartyPopper className="size-9 text-emerald-300" aria-hidden />
              </span>
            </motion.div>

            <h2
              id="escape-success-title"
              className="bg-gradient-to-r from-emerald-200 via-cyan-200 to-emerald-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-[0_0_24px_rgba(52,211,153,0.45)]"
            >
              탈출 성공!
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-200">
              자물쇠를 열고 막힌 길을 뚫었다. 당신의 집중력과 끈기가 빛을 발했어요.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-200/90">
              이 병동의 어둠을 뚫고 나아갈 힘이 생겼습니다. 정말 대단해요 — 축하합니다!
            </p>

            <motion.button
              type="button"
              className="mt-8 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDismiss}
            >
              시작 화면으로
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
