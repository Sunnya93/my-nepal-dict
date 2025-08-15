import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import { updateServerCache } from '@/lib/serverCache';

// Simple API key for admin access
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const apiKey = headersList.get('x-api-key');
    
    // Verify admin access
    if (apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Rebuild server cache from Firestore
    const coll = collection(db, COLLECTIONS.WORDS);
    const q = query(coll, orderBy('id'));
    const snap = await getDocs(q);

    const wordDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateServerCache(wordDocs);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache refreshed' 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh cache' }, 
      { status: 500 }
    );
  }
}
