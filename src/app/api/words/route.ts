import { NextResponse, NextRequest } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import { getCache, setCache } from '@/lib/serverCache';

const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hours

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const { data: cachedData, timestamp } = getCache();
    const base = request.nextUrl.searchParams.get('base'); // e.g. 'Word'

    const useCache = Array.isArray(cachedData) && (now - timestamp) < CACHE_DURATION;
    if (useCache) {
      console.log('✅ Serving from server cache - NO Firebase cost');
      const cacheAgeHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
      const filtered = base
        ? cachedData.filter((e: any) => e.docId === base || (typeof e.docId === 'string' && e.docId.startsWith(base + '_')))
        : cachedData;
      return NextResponse.json({
        words: filtered,
        fromCache: true,
        cacheAge: Math.floor((now - timestamp) / 1000),
        cacheAgeHours: cacheAgeHours
      });
    }
    
    // Fetch fresh data from Firebase
    if (!Array.isArray(cachedData)) {
      console.log('cost incurred (cache cleared)');
    }
    console.log('💰 Fetching from Firebase - Cost incurred');
    const coll = collection(db, COLLECTIONS.WORDS);
    const snap = await getDocs(coll);
    
    const wordDocs = snap.docs.map((d) => ({ 
      id: d.id, 
      ...d.data() 
    }));
    
    // Flatten all word entries and filter active ones
    const allWordEntries: any[] = [];
    wordDocs.forEach((wordDoc: any) => {
      // Filter shard set if base is specified
      if (base && !(wordDoc.id === base || (typeof wordDoc.id === 'string' && wordDoc.id.startsWith(base + '_')))) {
        return;
      }
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
    
    // Update cache
    // Cache always stores the full set (no base filter) to maximize reuse
    // If base was requested, we still cache the filtered result for response,
    // but keep the full data in memory for future unfiltered requests.
    if (!base) {
      setCache(allWordEntries);
    } else {
      // Build full set for cache
      const fullEntries: any[] = [];
      wordDocs.forEach((wordDoc: any) => {
        if (wordDoc.words && Array.isArray(wordDoc.words)) {
          wordDoc.words.forEach((entry: any) => {
            if (entry.DeleteFlag !== 'Y') {
              fullEntries.push({ ...entry, docId: wordDoc.id });
            }
          });
        }
      });
      setCache(fullEntries);
    }
    
    return NextResponse.json({
      words: allWordEntries,
      fromCache: false,
      totalDocs: snap.docs.length,
      totalWordEntries: allWordEntries.length
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch words' }, 
      { status: 500 }
    );
  }
}
