import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import type { GameDataSnapshot, GameDataStatus } from '../models/game-data';
import { parseGameDataDocuments } from '../utilities/game-data-parser';

@Injectable({ providedIn: 'root' })
export class GameDataService {
  private readonly http = inject(HttpClient);
  private readonly snapshotState = signal<GameDataSnapshot | null>(null);
  private readonly statusState = signal<GameDataStatus>('idle');
  private readonly errorState = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly snapshot = this.snapshotState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(): Promise<void> {
    this.loadPromise ??= this.loadDocuments();
    return this.loadPromise;
  }

  private async loadDocuments(): Promise<void> {
    this.statusState.set('loading');
    this.errorState.set(null);

    try {
      const documents = await firstValueFrom(
        forkJoin({
          races: this.http.get<unknown>('data/races.json'),
          classes: this.http.get<unknown>('data/classes.json'),
          deities: this.http.get<unknown>('data/deities.json'),
          compatibility: this.http.get<unknown>('data/compatibility.json'),
        }),
      );
      this.snapshotState.set(parseGameDataDocuments(documents));
      this.statusState.set('ready');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.errorState.set(`Game data could not be loaded: ${reason}`);
      this.statusState.set('error');
    }
  }
}
