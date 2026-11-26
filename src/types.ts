
export type Player = {
  id: string;
  name: string;
  position: string;
  speed: number;
  finishing: number;
  passing: number;
  dribbling: number;
  defense: number;
  control: number;
  xp: number;
  level: number;
  skill_points: number;
  awakened: boolean;
  created_at?: string;
};

export const attributes = [
  "speed",
  "finishing",
  "passing",
  "dribbling",
  "defense",
  "control"
] as const;

export type Attribute = typeof attributes[number];

export function overall(player: Pick<Player, Attribute>) {
  return Math.round(
    attributes.reduce((sum, key) => sum + player[key], 0) /
    attributes.length
  );
}
