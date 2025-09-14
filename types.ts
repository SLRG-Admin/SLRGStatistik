export interface Member {
  id?: number;
  external_id?: string;
  vorname: string;
  nachname: string;
}

export interface Trainer {
  id?: number;
  external_id?: string;
  vorname: string;
  nachname: string;
}

export interface Training {
  id?: number;
  external_id?: string;
  datum: string; // TT.MM.JJJJ
  thema: string;
  trainer1_id: number;
  trainer2_id?: number;
  completed?: boolean;
}

export interface Attendance {
  training_id: number;
  member_id: number;
}

export interface Setting {
  key: string;
  value: string;
}
