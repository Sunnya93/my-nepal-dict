// Simple ID generator for WordEntry ids (ES6+, no deps)
export function generateEntryId(): string {
  // 16-char base36 random id
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}


