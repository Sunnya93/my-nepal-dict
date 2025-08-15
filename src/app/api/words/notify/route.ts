import { NextResponse } from 'next/server';

// Server-Sent Events for real-time notifications
const connections = new Set<ReadableStreamDefaultController>();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller);
      
      // Send initial connection message
      controller.enqueue(`data: {"type":"connected"}\n\n`);
      
      // Clean up on close
      const cleanup = () => {
        connections.delete(controller);
      };
      
      // Handle client disconnect
      return cleanup;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();
    
    // Notify all connected clients about data changes
    const message = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    
    connections.forEach(controller => {
      try {
        controller.enqueue(message);
      } catch (error) {
        // Remove dead connections
        connections.delete(controller);
      }
    });
    
    return NextResponse.json({ success: true, notified: connections.size });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
