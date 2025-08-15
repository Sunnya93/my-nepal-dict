import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { addWordToCache, updateWordInCache } from '@/lib/serverCache';

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
    
    const { action, word, entryId } = await request.json();
    
    switch (action) {
      case 'add':
        addWordToCache(word);
        break;
      case 'update':
        updateWordInCache(entryId, word);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache ${action} completed` 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update cache' }, 
      { status: 500 }
    );
  }
}
