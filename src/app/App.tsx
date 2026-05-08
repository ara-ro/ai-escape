import { useCallback, useState } from 'react';
import GameRoom from './components/GameRoom';
import CluesPanel from './components/CluesPanel';
import NPCPanel from './components/NPCPanel';
import CommandInput from './components/CommandInput';
import GameHUD from './components/GameHUD';
import GameLog from './components/GameLog';
import { createInitialState, reduceGame } from '@/game';
import type { GameMessage, ScenarioObjectId } from '@/game/types';
import { HUD_LOCATION } from '@/game/scenario';
import { selectDiscoveredClues, selectObjectives, selectProgressPercent } from './selectors';

export default function App() {
  const [isCluesPanelOpen, setIsCluesPanelOpen] = useState(true);
  const [isNPCPanelOpen, setIsNPCPanelOpen] = useState(true);
  const [gameState, setGameState] = useState(createInitialState);

  const messages: GameMessage[] = gameState.log;

  const dispatchCommand = useCallback((text: string) => {
    setGameState((s) => reduceGame(s, { kind: 'command', text }));
  }, []);

  const dispatchInvestigate = useCallback((objectId: ScenarioObjectId) => {
    setGameState((s) => reduceGame(s, { kind: 'investigate', objectId }));
  }, []);

  const dispatchNpcChat = useCallback((text: string) => {
    setGameState((s) => reduceGame(s, { kind: 'npc_chat', text }));
  }, []);

  return (
    <div className="size-full bg-black overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <CluesPanel
            isOpen={isCluesPanelOpen}
            onToggle={() => setIsCluesPanelOpen(!isCluesPanelOpen)}
            inventory={gameState.inventory}
            clues={selectDiscoveredClues(gameState)}
            objectives={selectObjectives(gameState)}
            progressPercent={selectProgressPercent(gameState)}
          />

          <div className="flex-1 relative">
            <GameRoom onInvestigate={dispatchInvestigate} />
            <GameHUD gameTime={gameState.clock} location={HUD_LOCATION} />
            <GameLog messages={messages} />
          </div>

          <NPCPanel
            isOpen={isNPCPanelOpen}
            onToggle={() => setIsNPCPanelOpen(!isNPCPanelOpen)}
            messages={gameState.npcThread}
            affection={gameState.polyAffection}
            onNpcMessage={dispatchNpcChat}
          />
        </div>

        <div className="flex-shrink-0">
          <CommandInput onSendMessage={dispatchCommand} />
        </div>
      </div>
    </div>
  );
}
