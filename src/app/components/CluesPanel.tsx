import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Target,
  Lightbulb,
  Lock,
  ChevronLeft,
  ChevronRight,
  Backpack,
} from 'lucide-react';
import type { ClueDisplay, InventoryItemId, ObjectiveDisplay } from '@/game/types';
import { INVENTORY_META } from '@/game/scenario';

interface InventoryRow {
  id: string;
  label: string;
  short: string;
}

interface CluesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  /** 레거시 로컬 엔진: `INVENTORY_META`와 함께 사용 */
  inventory?: InventoryItemId[];
  /** API 등 동적 소지품 행. 있으면 `inventory`보다 우선합니다. */
  inventoryRows?: InventoryRow[];
  clues: ClueDisplay[];
  objectives: ObjectiveDisplay[];
  progressPercent: number;
}

export default function CluesPanel({
  isOpen,
  onToggle,
  inventory = [],
  inventoryRows,
  clues,
  objectives,
  progressPercent,
}: CluesPanelProps) {
  const rows: InventoryRow[] =
    inventoryRows ??
    inventory.map((id) => {
      const meta = INVENTORY_META[id];
      return { id, label: meta.label, short: meta.short };
    });
  return (
    <div className="h-full relative flex">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full bg-black/40 backdrop-blur-md border-r border-cyan-400/20 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-cyan-400/20">
              <h3 className="text-cyan-300 font-bold text-lg flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                <FileText className="w-5 h-5" />
                조사 기록
              </h3>
            </div>

            <div className="p-4 border-b border-cyan-400/20">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">현재 목표</span>
              </div>
              <div className="space-y-2">
                {objectives.map((objective) => (
                  <motion.div
                    key={objective.id}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border-2 mt-0.5 flex items-center justify-center ${
                        objective.completed
                          ? 'bg-green-500/30 border-green-500'
                          : 'border-gray-500'
                      }`}
                    >
                      {objective.completed && <div className="w-2 h-2 bg-green-400 rounded-sm" />}
                    </div>
                    <span
                      className={`text-sm ${
                        objective.completed ? 'text-gray-500 line-through' : 'text-gray-300'
                      }`}
                    >
                      {objective.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {rows.length > 0 ? (
              <div className="px-4 pt-3 pb-2 border-b border-cyan-400/10">
                <div className="flex items-center gap-2 mb-2">
                  <Backpack className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-xs font-semibold">소지품</span>
                </div>
                <ul className="space-y-1.5">
                  {rows.map((row) => (
                    <li key={row.id} className="text-xs text-gray-400 leading-relaxed">
                      <span className="text-gray-200 font-medium">{row.label}</span>
                      <span className="text-gray-600"> — </span>
                      {row.short}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-semibold">발견한 단서</span>
              </div>
              {clues.length === 0 ? (
                <p className="text-gray-600 text-xs leading-relaxed">
                  아직 조사로 새 단서가 남지 않았다. 주변을 더 살펴보자.
                </p>
              ) : (
                <div className="space-y-3">
                  {clues.map((clue, index) => (
                    <motion.div
                      key={clue.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900/60 backdrop-blur-sm p-3 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-cyan-300 font-medium text-sm group-hover:text-cyan-200">
                          {clue.title}
                        </h4>
                        <Lock className="w-3 h-3 text-yellow-400/60" />
                      </div>
                      <p className="text-gray-400 text-xs mb-2 leading-relaxed">{clue.description}</p>
                      <span className="text-gray-600 text-xs">{clue.time}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-cyan-400/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">진행도</span>
                <span className="text-cyan-400 text-xs font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full bg-black/60 backdrop-blur-md border border-cyan-400/30 border-l-0 rounded-r-lg p-2 hover:bg-black/80 transition-colors z-10"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-cyan-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        )}
      </button>
    </div>
  );
}
