import type { PrimaryCompatibilityIndex, PrimaryCompatibilityOption } from './compatibility';

export interface GameEntity {
  readonly id: string;
  readonly name: string;
  readonly abbreviation: string | null;
  readonly discordEmote: string | null;
}

export interface GameDataSnapshot {
  readonly gameDataVersion: string;
  readonly verificationStatus: string;
  readonly races: readonly GameEntity[];
  readonly classes: readonly GameEntity[];
  readonly deities: readonly GameEntity[];
  readonly primaryOptions: readonly PrimaryCompatibilityOption[];
  readonly primaryCompatibilityIndex: PrimaryCompatibilityIndex;
}

export type GameDataStatus = 'idle' | 'loading' | 'ready' | 'error';
