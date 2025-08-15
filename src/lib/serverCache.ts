// Simple in-memory server cache for word entries
// Note: This cache lives per runtime instance. In serverless deployments,
// multiple instances may keep separate caches.

let cachedData: any[] | null = null;
let cacheTimestamp = 0;

export function getCache() {
  return { data: cachedData, timestamp: cacheTimestamp };
}

export function setCache(data: any[]) {
  cachedData = data;
  cacheTimestamp = Date.now();
}

export function clearCache() {
  cachedData = null;
  cacheTimestamp = 0;
}

// Rebuild cache from full Word docs (flatten words[])
export function updateServerCache(newWordDocs: any[]) {
  const allWordEntries: any[] = [];
  newWordDocs.forEach((wordDoc: any) => {
    if (wordDoc.words && Array.isArray(wordDoc.words)) {
      wordDoc.words.forEach((entry: any) => {
        if (entry.DeleteFlag !== 'Y') {
          allWordEntries.push({
            ...entry,
            docId: wordDoc.id
          });
        }
      });
    }
  });
  setCache(allWordEntries);
  console.log('🔄 Server cache rebuilt (' + allWordEntries.length + ' word entries)');
}

export function addWordToCache(newWordEntry: any) {
  if (!cachedData) {
    console.log('⚠️ Server cache not initialized, skipping add operation');
    return;
  }
  if (newWordEntry.DeleteFlag === 'Y') return;
  cachedData.push(newWordEntry);
  cachedData.sort((a: any, b: any) => (a.Nepali || '').localeCompare(b.Nepali || ''));
  console.log('➕ Word entry added to server cache: ' + newWordEntry.Nepali);
}

export function updateWordInCache(entryId: string, updatedWordEntry: any) {
  if (!cachedData) {
    console.log('⚠️ Server cache not initialized, skipping update operation');
    return;
  }
  const index = cachedData.findIndex((w: any) => w.id === entryId);
  if (index === -1) {
    console.log('⚠️ Word entry not found in cache for update: ' + entryId);
    return;
  }
  if (updatedWordEntry.DeleteFlag === 'Y') {
    cachedData.splice(index, 1);
    console.log('🗑️ Word entry removed from server cache: ' + updatedWordEntry.Nepali);
    return;
  }
  cachedData[index] = { ...cachedData[index], ...updatedWordEntry };
  cachedData.sort((a: any, b: any) => (a.Nepali || '').localeCompare(b.Nepali || ''));
  console.log('✏️ Word entry updated in server cache: ' + updatedWordEntry.Nepali);
}


