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
    // Version 3 ist die neueste Version und muss die Definition aller Tabellen enthalten.
    // Dexie erfordert, dass jede neue Version die Schemata aller bestehenden Tabellen wiederholt.
    this.version(3).stores({
      members: '++id, external_id, nachname, vorname',
      trainers: '++id, external_id, nachname, vorname',
      trainings: '++id, external_id, datum, thema, trainer1_id, trainer2_id, completed', // Das Feld 'completed' wurde in dieser Version hinzugefügt.
      attendances: '[training_id+member_id], training_id, member_id',
      settings: 'key', // Diese Tabelle wurde in einer früheren Version eingeführt, muss aber hier erneut deklariert werden.
    });
  }
}

export const db = new TrainingDB();
