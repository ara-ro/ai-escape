export type GameMessageType = 'action' | 'narration';

export interface GameMessage {
  id: string;
  text: string;
  type: GameMessageType;
  timestamp: string;
}

export type NpcEmotion = 'neutral' | 'happy' | 'sad' | 'curious';

export interface NpcChatMessage {
  id: string;
  text: string;
  emotion: NpcEmotion;
  sender: 'npc' | 'player';
}

export type InventoryItemId = 'rust_key' | 'blood_memo';

export type ScenarioObjectId =
  | 'cabinet'
  | 'bulletin'
  | 'trash'
  | 'exitDoor'
  | 'vent';

export interface GameFlags {
  readMemo: boolean;
  cabinetOpened: boolean;
  exitDoorOpen: boolean;
  bulletinRead: boolean;
}

export interface GameObjectives {
  password: boolean;
  exit: boolean;
}

export interface GameState {
  roomId: string;
  clock: string;
  inventory: InventoryItemId[];
  discoveredClueIds: string[];
  flags: GameFlags;
  objectives: GameObjectives;
  polyAffection: number;
  log: GameMessage[];
  npcThread: NpcChatMessage[];
}

export type GameDispatchInput =
  | { kind: 'command'; text: string }
  | { kind: 'investigate'; objectId: ScenarioObjectId }
  | { kind: 'npc_chat'; text: string };

export interface ClueDisplay {
  id: string;
  title: string;
  description: string;
  time: string;
}

export interface ObjectiveDisplay {
  id: string;
  text: string;
  completed: boolean;
}
