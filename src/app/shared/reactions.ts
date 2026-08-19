export interface Reaction {
  id: string;
  path: string;
}

const JPG_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const GIF_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

export function getReactionPath(id: string): string {
  return `/images/reactions/${id}.${id.startsWith('0') ? 'webp' : 'jpg'}`;
}

export const REACTIONS: Reaction[] = [...JPG_IDS, ...GIF_IDS].map((id) => ({
  id,
  path: getReactionPath(id),
}));

export function isReactionText(text: string): boolean {
  return /^:[a-zA-Z0-9_-]+:$/.test(text);
}
