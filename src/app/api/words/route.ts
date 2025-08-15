import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import { getCache, setCache } from '@/lib/serverCache';

const CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hours

export async function GET() {
  try {
    const now = Date.now();
    const { data: cachedData, timestamp } = getCache();

    if (cachedData && (now - timestamp) < CACHE_DURATION) {
      console.log('✅ Serving from server cache - NO Firebase cost');
      const cacheAgeHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
      return NextResponse.json({
        words: cachedData,
        fromCache: true,
        cacheAge: Math.floor((now - timestamp) / 1000),
        cacheAgeHours: cacheAgeHours
      });
    }
    
    // Fetch fresh data from Firebase
    console.log('💰 Fetching from Firebase - Cost incurred');
    const coll = collection(db, COLLECTIONS.WORDS);
    const q = query(coll, orderBy('id')); // Order by document ID instead
    const snap = await getDocs(q);
    
    const wordDocs = snap.docs.map((d) => ({ 
      id: d.id, 
      ...d.data() 
    }));
    
    // Flatten all word entries and filter active ones
    const allWordEntries: any[] = [];
    wordDocs.forEach((wordDoc: any) => {
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
    setCache(allWordEntries);
    
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
