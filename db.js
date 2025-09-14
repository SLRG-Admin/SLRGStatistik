import Dexie from 'dexie';

export class TrainingDB extends Dexie {
  members;
  trainers;
  trainings;
  attendances;
  settings;

  constructor() {
    super('TrainingDB');
    this.version(3).stores({
      members: '++id, external_id, nachname, vorname',
      trainers: '++id, external_id, nachname, vorname',
      trainings: '++id, external_id, datum, thema, trainer1_id, trainer2_id, completed',
      attendances: '[training_id+member_id], training_id, member_id',
      settings: 'key',
    });
  }
}

export const db = new TrainingDB();