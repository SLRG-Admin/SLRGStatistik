import Dexie, { Table } from 'dexie';
import type { Member, Trainer, Training, Attendance, Setting } from './types';

export class TrainingDB extends Dexie {
  members!: Table<Member>;
  trainers!: Table<Trainer>;
  trainings!: Table<Training>;
  attendances!: Table<Attendance>;
  settings!: Table<Setting>;

  constructor() {
    super('TrainingDB');
    this.version(2).stores({
      members: '++id, external_id, nachname, vorname',
      trainers: '++id, external_id, nachname, vorname',
      trainings: '++id, external_id, datum, thema, trainer1_id, trainer2_id',
      attendances: '[training_id+member_id], training_id, member_id',
      settings: 'key',
    });
    this.version(3).stores({
        trainings: '++id, external_id, datum, thema, trainer1_id, trainer2_id, completed',
    });
  }
}

export const db = new TrainingDB();
