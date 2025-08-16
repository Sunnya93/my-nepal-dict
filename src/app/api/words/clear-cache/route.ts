import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { clearCache } from '@/lib/serverCache';

// Simple API key for admin access
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const apiKey = headersList.get('x-api-key') ?? '';
    
    // Verify admin access (require key only if configured)
    if (ADMIN_API_KEY && (apiKey ?? '') !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    clearCache();
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' }, 
      { status: 500 }
    );
  }
}


