import type { InventoryItemId, ScenarioObjectId } from './types';

export const ROOM_ID = 'hallway_3f';

export const ROOM_TITLE = '폐쇄된 병동 - 3층 복도';

export const HUD_LOCATION = '폐쇄된 병동 3층 복도';

export const INITIAL_CLOCK = '23:47';

export const POLY_OPENING_LINE = '약장 비밀번호는 이 방 어딘가에 있어.';

export const INVENTORY_META: Record<
  InventoryItemId,
  { label: string; short: string }
> = {
  rust_key: { label: '녹슨 열쇠', short: '손에 묻은 녹이가 차갑게 식어 있다.' },
  blood_memo: {
    label: '피 묻은 메모',
    short: '아직 펼쳐 읽지 않았다. 겉만 봐도 불길한 얼룩이 번진다.',
  },
};

/** 조사로만 패널에 올라가는 단서 (미발견 시 설명 금지) */
export const CLUE_CATALOG: Record<string, { title: string; description: string }> = {
  bulletin_hint: {
    title: '벽 게시판의 메모',
    description:
      '낡은 공지지 위에 볼펜으로 덧칠한 글귀가 있다. “약장 번호는 밤마다 바뀐다. 오늘은 피로 적힌 쪽지와 같다.”',
  },
  memo_cipher: {
    title: '메모의 숫자',
    description:
      '번진 글씨 사이로 숫자가 겨우 읽힌다. 3-7-2-9. 자물쇠 네 자리에 그대로 넣어볼 만한 순서다.',
  },
  cabinet_inner: {
    title: '약장 안쪽의 낙서',
    description:
      '빈 앰플 상자 틈에 희미한 낙서가 있다. “3F-W” 그리고 화살표가 복도 끝 쪽을 가리킨다.',
  },
  exit_door_detail: {
    title: '복도 끝 문의 잠금',
    description:
      '두꺼운 방화문이다. 손잡이 옆에 낡은 열쇠구멍이 하나 있다. 녹슨 열쇠가 맞을지도 모르겠다.',
  },
};

export const SCENARIO_OBJECTS: {
  id: ScenarioObjectId;
  name: string;
  x: number;
  y: number;
  size: number;
}[] = [
  { id: 'vent', name: '천장 환풍구', x: 50, y: 14, size: 52 },
  { id: 'exitDoor', name: '복도 끝 문', x: 50, y: 30, size: 80 },
  { id: 'bulletin', name: '벽 게시판', x: 22, y: 44, size: 58 },
  { id: 'trash', name: '쓰레기통', x: 18, y: 70, size: 54 },
  { id: 'cabinet', name: '약장', x: 78, y: 52, size: 64 },
];

export const BROADCAST_FLAVOR = [
  '…안내 드립니다. 복도… 복도… 점검…',
  '…환자분들은… 조용히…',
  '…삑… 삑…',
] as const;
