import type { SceneData } from './gameApi';
import { getApiOrigin } from './gameApi';

export interface SceneViewHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  isInvestigated?: boolean;
  isLocked?: boolean;
}

export interface SceneViewExit {
  id: string;
  label: string;
  isLocked?: boolean;
  targetSceneId?: string;
  xPercent: number;
  yPercent: number;
}

export interface SceneViewState {
  title: string;
  description: string;
  backgroundImageUrl: string | null;
  hotspots: SceneViewHotspot[];
  exits: SceneViewExit[];
}

/** 프로덕션에서는 API 오리진을 붙이고, 개발(동일 출처)에서는 상대 경로 + 프록시 사용 */
export function resolveSceneMediaUrl(path: string | undefined | null): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const origin = getApiOrigin();
  if (!origin) return p;
  return `${origin.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sceneDataToView(scene: SceneData): SceneViewState {
  const title = String(scene.title ?? scene.sceneId ?? scene.id ?? '씬');
  const description = String(scene.description ?? '');

  const bgRoot = scene.background;
  const imageUrl =
    bgRoot && typeof bgRoot === 'object' && 'imageUrl' in bgRoot
      ? String((bgRoot as { imageUrl?: string }).imageUrl ?? '')
      : '';

  const rawHotspots = Array.isArray(scene.hotspots) ? scene.hotspots : [];
  const hotspots: SceneViewHotspot[] = rawHotspots.map((h, i) => {
    const pos =
      h.position && typeof h.position === 'object'
        ? (h.position as { x?: unknown; y?: unknown })
        : {};
    const rawX = typeof pos.x === 'number' ? pos.x : Number(pos.x);
    const rawY = typeof pos.y === 'number' ? pos.y : Number(pos.y);
    const x = Number.isFinite(rawX) ? clamp(rawX, 5, 95) : clamp(18 + ((i * 37) % 65), 5, 95);
    const y = Number.isFinite(rawY) ? clamp(rawY, 8, 88) : clamp(28 + ((i * 19) % 45), 8, 88);
    return {
      id: String(h.id ?? `hotspot_${i}`),
      label: String(h.label ?? h.name ?? h.id ?? '조사 지점'),
      x,
      y,
      size: 56,
      isInvestigated: Boolean(h.isInvestigated),
      isLocked: Boolean(h.isLocked),
    };
  });

  const rawExits = Array.isArray(scene.exits) ? scene.exits : [];
  const n = rawExits.length;
  const exits: SceneViewExit[] = rawExits.map((ex, i) => {
    const row = ex as Record<string, unknown>;
    const slot = n > 0 ? ((i + 1) / (n + 1)) * 100 : 50;
    return {
      id: String(row.exitId ?? row.id ?? `exit_${i}`),
      label: String(row.label ?? row.exitId ?? '출구'),
      isLocked: Boolean(row.isLocked),
      targetSceneId: typeof row.targetSceneId === 'string' ? row.targetSceneId : undefined,
      xPercent: slot,
      yPercent: 86,
    };
  });

  return {
    title,
    description,
    backgroundImageUrl: resolveSceneMediaUrl(imageUrl || undefined),
    hotspots,
    exits,
  };
}
