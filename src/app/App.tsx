import { useState } from 'react';
import GameRoom from './components/GameRoom';
import CluesPanel from './components/CluesPanel';
import NPCPanel from './components/NPCPanel';
import CommandInput from './components/CommandInput';
import GameHUD from './components/GameHUD';
import GameLog from './components/GameLog';

interface GameMessage {
  id: string;
  text: string;
  type: 'action' | 'system' | 'narration';
  timestamp: string;
}

export default function App() {
  const [isCluesPanelOpen, setIsCluesPanelOpen] = useState(true);
  const [isNPCPanelOpen, setIsNPCPanelOpen] = useState(true);
  const [gameMessages, setGameMessages] = useState<GameMessage[]>([
    {
      id: '1',
      text: '게임이 시작되었습니다. 폐쇄된 병동에서 탈출하세요.',
      type: 'system',
      timestamp: '00:00',
    },
  ]);

  const handleSendMessage = (message: string) => {
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMessage: GameMessage = {
      id: Date.now().toString(),
      text: message,
      type: 'action',
      timestamp,
    };

    setGameMessages([...gameMessages, newMessage]);

    setTimeout(() => {
      const responseMessage: GameMessage = {
        id: (Date.now() + 1).toString(),
        text: `"${message}" - 시도해보았지만 아무 일도 일어나지 않았다.`,
        type: 'narration',
        timestamp,
      };
      setGameMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

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
            <GameLog messages={gameMessages} />
          </div>

          {/* Right Panel - NPC */}
          <NPCPanel
            isOpen={isNPCPanelOpen}
            onToggle={() => setIsNPCPanelOpen(!isNPCPanelOpen)}
          />
        </div>

        {/* Bottom - Command Input */}
        <div className="flex-shrink-0">
          <CommandInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}