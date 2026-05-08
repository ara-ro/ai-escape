import type { ClueDisplay, GameState, ObjectiveDisplay } from '@/game/types';
import { CLUE_CATALOG } from '@/game/scenario';

export function selectObjectives(state: GameState): ObjectiveDisplay[] {
  return [
    {
      id: 'password',
      text: '약장의 비밀번호 찾기',
      completed: state.objectives.password,
    },
    {
      id: 'exit',
      text: '3층 출구 찾기',
      completed: state.objectives.exit,
    },
  ];
}

export function selectDiscoveredClues(state: GameState): ClueDisplay[] {
  return state.discoveredClueIds.map((id) => {
    const row = CLUE_CATALOG[id];
    return {
      id,
      title: row?.title ?? id,
      description: row?.description ?? '',
      time: '조사로 확보',
    };
  });
}

export function selectProgressPercent(state: GameState): number {
  const done =
    (state.objectives.password ? 1 : 0) + (state.objectives.exit ? 1 : 0);
  return Math.round((done / 2) * 100);
}
