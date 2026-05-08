import { useState } from 'react';
import GameRoom from './components/GameRoom';
import CluesPanel from './components/CluesPanel';
import NPCPanel from './components/NPCPanel';
import CommandInput from './components/CommandInput';
import GameHUD from './components/GameHUD';

export default function App() {
  const [isCluesPanelOpen, setIsCluesPanelOpen] = useState(true);
  const [isNPCPanelOpen, setIsNPCPanelOpen] = useState(true);

  return (
    <div className="size-full bg-black overflow-hidden">
      {/* Main Game Layout */}
      <div className="h-full flex flex-col">
        {/* Game Area with Side Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Clues */}
          <CluesPanel
            isOpen={isCluesPanelOpen}
            onToggle={() => setIsCluesPanelOpen(!isCluesPanelOpen)}
          />

          {/* Center - Game Room */}
          <div className="flex-1 relative">
            <GameRoom />
            <GameHUD />
          </div>

          {/* Right Panel - NPC */}
          <NPCPanel
            isOpen={isNPCPanelOpen}
            onToggle={() => setIsNPCPanelOpen(!isNPCPanelOpen)}
          />
        </div>

        {/* Bottom - Command Input */}
        <div className="flex-shrink-0">
          <CommandInput />
        </div>
      </div>
    </div>
  );
}