export interface WordEntry {
  id?: string;
  Nepali: string;
  Korean: string;
  English?: string;
  Sound?: string;
  Example?: string;
  DeleteFlag?: string; // 'Y' | 'N'
  CreatedDate?: unknown; // Firestore Timestamp | Date
  UpdateDate?: unknown; // Firestore Timestamp | Date
}

export interface Word {
  id: string;
  words: WordEntry[];
}


