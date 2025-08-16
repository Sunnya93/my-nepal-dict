// Client-side API functions
import type { WordEntry } from '@/types/word';

interface ApiResponse {
  words: WordEntry[];
  fromCache: boolean;
  cacheAge?: number;
  cacheAgeHours?: number;
  totalDocs?: number;
  totalWordEntries?: number;
}

export async function fetchWords(): Promise<WordEntry[]> {
  try {
    const response = await fetch('/api/words', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    
    if (data.fromCache) {
      console.log(`✅ Data from server cache (${data.cacheAgeHours}h ${Math.floor((data.cacheAge! % 3600) / 60)}m old) - NO cost`);
    } else {
      console.log(`💰 Fresh data from Firebase (${data.totalDocs} docs, ${data.totalWordEntries} entries) - Cost incurred`);
    }
    
    return data.words;
    
  } catch (error) {
    console.error('Failed to fetch words:', error);
    throw error;
  }
}

export async function refreshCache(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/words/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    return false;
  }
}

export async function updateCacheWord(action: 'add' | 'update', word: any, entryId?: string, apiKey?: string): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const key = apiKey || process.env.NEXT_PUBLIC_ADMIN_API_KEY;
    if (key) {
      headers['x-api-key'] = key;
    }
    
    const response = await fetch('/api/words/update-cache', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, word, entryId })
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to update cache:', error);
    return false;
  }
}

export async function clearServerCache(apiKey: string): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {})
    };
    const response = await fetch('/api/words/clear-cache', {
      method: 'POST',
      headers
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to clear server cache:', error);
    return false;
  }
}