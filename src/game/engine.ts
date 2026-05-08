import type {
  GameDispatchInput,
  GameMessage,
  GameState,
  NpcChatMessage,
  NpcEmotion,
  ScenarioObjectId,
} from './types';
import {
  BROADCAST_FLAVOR,
  CLUE_CATALOG,
  INITIAL_CLOCK,
  POLY_OPENING_LINE,
  ROOM_ID,
  SCENARIO_OBJECTS,
} from './scenario';

function bumpClock(clock: string): string {
  const [h, m] = clock.split(':').map(Number);
  let nextM = m + 1;
  let nextH = h;
  if (nextM >= 60) {
    nextM = 0;
    nextH = (nextH + 1) % 24;
  }
  return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatGm(parts: {
  atmosphere: string[];
  result: string;
  clue?: string;
  poly?: string;
}): string {
  const blocks: string[] = [];
  blocks.push(parts.atmosphere.join('\n'));
  blocks.push('');
  blocks.push(parts.result);
  if (parts.clue) {
    blocks.push('');
    blocks.push(`새롭게 발견한 단서: ${parts.clue}`);
  }
  if (parts.poly) {
    blocks.push('');
    blocks.push(`폴리: “${parts.poly}”`);
  }
  return blocks.join('\n');
}

function defaultAtmosphere(): string[] {
  return [
    '형광등이 규칙적으로 지직거린다. 공기는 소독약과 먼지가 뒤섞인 냄새다.',
    '복도 끝이 어둑하게 이어지고, 벽면에는 금이 간 타일 줄만 고이게 남았다.',
    '폐쇄된 병동 3층—당신은 여기서 나가야 한다.',
  ];
}

function pushLog(prev: GameMessage[], clock: string, text: string, type: GameMessage['type']): GameMessage[] {
  return [...prev, { id: newId(), text, type, timestamp: clock }];
}

function clampAffection(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function objectLabel(id: ScenarioObjectId): string {
  return SCENARIO_OBJECTS.find((o) => o.id === id)?.name ?? id;
}

function addClueIds(state: GameState, ids: string[]): GameState {
  const merged = [...state.discoveredClueIds];
  for (const id of ids) {
    if (!merged.includes(id)) merged.push(id);
  }
  return { ...state, discoveredClueIds: merged };
}

function polyEchoLine(): string {
  const pick = BROADCAST_FLAVOR[Math.floor(Math.random() * BROADCAST_FLAVOR.length)];
  return pick;
}

function buildPolyReply(
  text: string,
  state: GameState,
): { reply: string; emotion: NpcEmotion; delta: number } {
  const q = text.trim();
  let delta = 2;
  let emotion: NpcEmotion = 'happy';
  let reply =
    '천천히 말해줘. 여기선 작은 소리도 길게 남거든.';

  if (/비밀|번호|약장|자물쇠/.test(q)) {
    reply = '약장 비밀번호는 이 방 어딘가에 있어. 눈에 닿는 것부터 의심해봐.';
    emotion = 'curious';
    delta = 4;
  } else if (/무섭|두려|도와|나가/.test(q)) {
    reply = '무서우면 숨 막히는 건 당연해. 그래도 손은 움직여야 해.';
    emotion = 'sad';
    delta = 5;
  } else if (/미안|고마|괜찮/.test(q)) {
    reply = '말투가 부드럽네. 그런 사람은 여기서 오래 버티곤 해.';
    emotion = 'happy';
    delta = 6;
  } else if (/닥쳐|싫|시끄/.test(q)) {
    reply = '…….';
    emotion = 'sad';
    delta = -10;
  }

  if (Math.random() < 0.28) {
    reply = `${reply}\n\n(폴리가 고개를 갸웃하며 스스로에게 말한다) “${polyEchoLine()}”`;
    emotion = 'curious';
  }

  return { reply, emotion, delta };
}

function investigateCore(state: GameState, objectId: ScenarioObjectId): GameState {
  let next: GameState = { ...state };
  const atmo = defaultAtmosphere();
  let narration = '';
  let polyLine: string | undefined;

  switch (objectId) {
    case 'bulletin': {
      if (!next.flags.bulletinRead) {
        next = {
          ...next,
          flags: { ...next.flags, bulletinRead: true },
        };
        next = addClueIds(next, ['bulletin_hint']);
        const clue = CLUE_CATALOG.bulletin_hint;
        narration = formatGm({
          atmosphere: atmo,
          result:
            '벽 게시판에 오래된 안내문이 여러 겹 붙어 있다. 그 사이로 누군가 급하게 덧칠한 듯한 글씨가 눈에 들어온다.',
          clue: `${clue.title} — ${clue.description}`,
        });
      } else {
        narration = formatGm({
          atmosphere: atmo,
          result:
            '이미 읽은 글귀다. 똑같은 문장이 차갑게 시선을 되돌려준다.',
        });
      }
      break;
    }
    case 'trash': {
      narration = formatGm({
        atmosphere: atmo,
        result:
          '쓰레기통 안은 대부분 비어 있다. 마른 붕대 조각과 찌그러진 종이컵만이 서로를 스치듯 소리 낸다.',
      });
      break;
    }
    case 'vent': {
      narration = formatGm({
        atmosphere: atmo,
        result:
          '천장 환풍구 너머로 바람이 불규칙하게 새어 나온다. 금속 격자가 손끝에 얼음처럼 닿는다.',
      });
      polyLine = '위… 위… 위험한 건 아니야. 아마도.';
      next = { ...next, polyAffection: clampAffection(next.polyAffection - 2) };
      break;
    }
    case 'cabinet': {
      if (next.flags.cabinetOpened) {
        narration = formatGm({
          atmosphere: atmo,
          result: '약장 안은 텅 비어 있다. 방금 전의 긴장만이 여기 남아 있다.',
        });
      } else if (next.flags.readMemo) {
        next = {
          ...next,
          flags: { ...next.flags, cabinetOpened: true },
        };
        next = addClueIds(next, ['cabinet_inner']);
        const clue = CLUE_CATALOG.cabinet_inner;
        narration = formatGm({
          atmosphere: atmo,
          result:
            '메모에 적힌 숫자를 자물쇠에 맞추자, 둔탁한 소리와 함께 약장 문이 살짝 열린다. 차가운 금속 냄새가 퍼진다.',
          clue: `${clue.title} — ${clue.description}`,
        });
      } else {
        narration = formatGm({
          atmosphere: atmo,
          result:
            '약장은 굳게 닫혀 있다. 네 자리 숫자 자물쇠가 침묵으로 묻어온다. 아직 맞출 단서가 부족한 느낌이다.',
        });
      }
      break;
    }
    case 'exitDoor': {
      if (next.flags.exitDoorOpen) {
        narration = formatGm({
          atmosphere: atmo,
          result:
            '문 너머로 계단의 그림자가 낮게 드리워진다. 차가운 바깥 공기가 얼굴을 스친다.',
        });
      } else if (!next.discoveredClueIds.includes('exit_door_detail')) {
        next = addClueIds(next, ['exit_door_detail']);
        const clue = CLUE_CATALOG.exit_door_detail;
        narration = formatGm({
          atmosphere: atmo,
          result:
            '복도 끝의 방화문이 길을 막고 있다. 손을 얹으면 떨림이 아니라 문 자체의 무게가 먼저 느껴진다.',
          clue: `${clue.title} — ${clue.description}`,
        });
      } else {
        narration = formatGm({
          atmosphere: atmo,
          result:
            '방화문은 여전히 굳게 닫혀 있다. 열쇠구멍이 손끝에 차갑게 맞닿는다.',
        });
      }
      break;
    }
    default: {
      narration = formatGm({
        atmosphere: atmo,
        result: '그곳에서는 특별한 것이 느껴지지 않는다.',
      });
    }
  }

  next = {
    ...next,
    log: pushLog(next.log, next.clock, narration, 'narration'),
  };
  if (polyLine) {
    const emotion: NpcEmotion = 'curious';
    next = {
      ...next,
      npcThread: [
        ...next.npcThread,
        { id: newId(), text: polyLine, emotion, sender: 'npc' },
      ],
    };
  }
  return next;
}

function tryOpenExitDoor(state: GameState): GameState | null {
  if (state.flags.exitDoorOpen) return null;
  if (!state.inventory.includes('rust_key')) return null;
  let next: GameState = {
    ...state,
    clock: bumpClock(state.clock),
    flags: { ...state.flags, exitDoorOpen: true },
    objectives: { ...state.objectives, exit: true },
    polyAffection: clampAffection(state.polyAffection + 5),
  };
  const narration = formatGm({
    atmosphere: defaultAtmosphere(),
    result:
      '녹슨 열쇠를 구멍에 맞추자, 오래된 철이 서로 긁는 소리가 난 뒤 문이 천천히 밀린다. 복도 끝의 공기가 바뀐다.',
    poly: '잘했어. 소리는… 아직 끝이 아닐 수도 있어.',
  });
  next = { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
  next = {
    ...next,
    npcThread: [
      ...next.npcThread,
      { id: newId(), text: '잘했어. 소리는… 아직 끝이 아닐 수도 있어.', emotion: 'happy', sender: 'npc' },
    ],
  };
  return next;
}

function tryReadMemo(state: GameState): GameState | null {
  if (state.flags.readMemo) return null;
  if (!state.inventory.includes('blood_memo')) return null;
  let next: GameState = {
    ...state,
    clock: bumpClock(state.clock),
    flags: { ...state.flags, readMemo: true },
    objectives: { ...state.objectives, password: true },
  };
  next = addClueIds(next, ['memo_cipher']);
  const clue = CLUE_CATALOG.memo_cipher;
  const narration = formatGm({
    atmosphere: defaultAtmosphere(),
    result:
      '젖은 손가락으로 메모를 펼친다. 번진 자국 사이로 숫자가 겨우 드러난다. 숨이 얕아진다.',
    clue: `${clue.title} — ${clue.description}`,
  });
  next = { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
  return next;
}

function applyRoomText(state: GameState, raw: string): GameState {
  const q = raw.trim();
  if (!q) return state;

  let next = state;
  const clock = bumpClock(state.clock);
  next = { ...next, log: pushLog(next.log, clock, q, 'action'), clock };

  if (/폴리|앵무/.test(q)) {
    const { reply, emotion, delta } = buildPolyReply(q, next);
    next = {
      ...next,
      polyAffection: clampAffection(next.polyAffection + delta),
      npcThread: [
        ...next.npcThread,
        { id: newId(), text: q, emotion: 'neutral', sender: 'player' },
        { id: newId(), text: reply, emotion, sender: 'npc' },
      ],
    };
    const narration = formatGm({
      atmosphere: defaultAtmosphere(),
      result: '폴리가 고개를 기울이고, 작은 부리로 공기를 두드리듯 말을 잇는다.',
      poly: reply.replace(/\n\n\(폴리가[\s\S]*/, '').trim() || reply,
    });
    next = { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
    return next;
  }

  if (/메모|쪽지/.test(q) && !/게시판/.test(q)) {
    const memo = tryReadMemo(next);
    if (memo) return memo;
    if (next.flags.readMemo) {
      const narration = formatGm({
        atmosphere: defaultAtmosphere(),
        result: '이미 숫자를 확인했다. 같은 줄이 손끝에 다시 새겨질 뿐이다.',
      });
      return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
    }
  }

  if (
    (/문/.test(q) && /열|돌려|밀어|잠금/.test(q)) ||
    (/열쇠/.test(q) && /문/.test(q))
  ) {
    if (next.flags.exitDoorOpen) {
      const narration = formatGm({
        atmosphere: defaultAtmosphere(),
        result: '문은 이미 열려 있다. 바깥쪽 공기가 아직도 얇게 새어 들어온다.',
      });
      return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
    }
    const opened = tryOpenExitDoor(next);
    if (opened) return opened;
    const narration = formatGm({
      atmosphere: defaultAtmosphere(),
      result:
        '열쇠가 맞지 않거나, 아직 손이 떨려 제대로 들어가지 않는다. 문틈의 차가운 기운이 손등을 핥는다.',
    });
    return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
  }

  if (/게시판|공지/.test(q)) {
    return investigateCore(next, 'bulletin');
  }
  if (/쓰레기/.test(q)) {
    return investigateCore(next, 'trash');
  }
  if (/환풍|천장/.test(q)) {
    return investigateCore(next, 'vent');
  }
  if (/약장/.test(q)) {
    return investigateCore(next, 'cabinet');
  }
  if (/문|복도\s*끝/.test(q)) {
    return investigateCore(next, 'exitDoor');
  }
  if (/열쇠/.test(q)) {
    const narration = formatGm({
      atmosphere: defaultAtmosphere(),
      result:
        '녹슨 열쇠를 손바닥에 올려본다. 살짝 거친 녹이 윤곽이 피부에 박인다. 어딘가의 구멍이 기다리는 것 같다.',
    });
    return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
  }

  if (/이동|걸어|앞으로|뒤로/.test(q)) {
    const narration = formatGm({
      atmosphere: defaultAtmosphere(),
      result:
        '발소리가 복도에 퍼졌다가 금방 흡수된다. 다른 층으로 이어질 만한 계단은 어둠 너머로 막혀 보인다.',
    });
    return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
  }

  const narration = formatGm({
    atmosphere: defaultAtmosphere(),
    result:
      '그 행동은 이 복도에서 뚜렷한 변화를 만들지 못한다. 다른 말로, 다른 곳을, 혹은 손에 있는 것부터 살펴볼까.',
  });
  return { ...next, log: pushLog(next.log, next.clock, narration, 'narration') };
}

function applyNpcChat(state: GameState, raw: string): GameState {
  const q = raw.trim();
  if (!q) return state;
  let next: GameState = {
    ...state,
    clock: bumpClock(state.clock),
    npcThread: [
      ...state.npcThread,
      { id: newId(), text: q, emotion: 'neutral', sender: 'player' },
    ],
  };
  const { reply, emotion, delta } = buildPolyReply(q, next);
  next = {
    ...next,
    polyAffection: clampAffection(next.polyAffection + delta),
    npcThread: [
      ...next.npcThread,
      { id: newId(), text: reply, emotion, sender: 'npc' },
    ],
  };
  return next;
}

export function createInitialState(): GameState {
  const clock = INITIAL_CLOCK;
  const opening = formatGm({
    atmosphere: defaultAtmosphere(),
    result:
      '당신은 차가운 벽에 기대지 않은 채 숨을 고른다. 손안에는 녹슨 열쇠와 피 묻은 메모가 남아 있다.',
  });
  const log: GameMessage[] = [
    { id: newId(), text: opening, type: 'narration', timestamp: clock },
  ];
  const npcThread: NpcChatMessage[] = [
    {
      id: newId(),
      text: POLY_OPENING_LINE,
      emotion: 'happy',
      sender: 'npc',
    },
  ];
  return {
    roomId: ROOM_ID,
    clock,
    inventory: ['rust_key', 'blood_memo'],
    discoveredClueIds: [],
    flags: {
      readMemo: false,
      cabinetOpened: false,
      exitDoorOpen: false,
      bulletinRead: false,
    },
    objectives: { password: false, exit: false },
    polyAffection: 65,
    log,
    npcThread,
  };
}

export function reduceGame(state: GameState, input: GameDispatchInput): GameState {
  switch (input.kind) {
    case 'command':
      return applyRoomText(state, input.text);
    case 'investigate': {
      const label = objectLabel(input.objectId);
      const nextClock = bumpClock(state.clock);
      const pre: GameState = {
        ...state,
        clock: nextClock,
        log: pushLog(state.log, nextClock, `${label}을(를) 조사한다.`, 'action'),
      };
      return investigateCore(pre, input.objectId);
    }
    case 'npc_chat':
      return applyNpcChat(state, input.text);
    default:
      return state;
  }
}
