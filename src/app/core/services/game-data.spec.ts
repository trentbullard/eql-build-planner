import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GameDataService } from './game-data';

describe('GameDataService', () => {
  it('loads and parses all four static data documents', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(GameDataService);
    const http = TestBed.inject(HttpTestingController);

    const loading = service.load();
    expect(service.status()).toBe('loading');

    http.expectOne('data/races.json').flush(entityDocument('races', 'ogre', 'Ogre', 'OGR'));
    http.expectOne('data/classes.json').flush(entityDocument('classes', 'shaman', 'Shaman', 'SHM'));
    http
      .expectOne('data/deities.json')
      .flush(entityDocument('deities', 'rallos-zek', 'Rallos Zek', null));
    http.expectOne('data/compatibility.json').flush({
      ...metadata(),
      scope: 'initial-primary-selection',
      primaryOptions: [
        {
          raceId: 'ogre',
          classId: 'shaman',
          deityIds: ['rallos-zek'],
        },
      ],
    });

    await loading;

    expect(service.status()).toBe('ready');
    expect(service.error()).toBeNull();
    expect(service.snapshot()?.races[0]?.name).toBe('Ogre');
    expect(service.snapshot()?.primaryCompatibilityIndex.deityIdsByRaceId.get('ogre')).toEqual(
      new Set(['rallos-zek']),
    );
    http.verify();
  });
});

function entityDocument(
  collection: 'races' | 'classes' | 'deities',
  id: string,
  name: string,
  abbreviation: string | null,
) {
  const entity = {
    id,
    name,
    discordEmote: null,
    sourceIds: ['test-source'],
    ...(abbreviation === null ? {} : { abbreviation }),
  };
  return { ...metadata(), [collection]: [entity] };
}

function metadata() {
  return {
    schemaVersion: 1,
    gameDataVersion: 'test',
    datasetStatus: 'complete',
    verificationStatus: 'community-reported',
    sources: [{ id: 'test-source' }],
  };
}
