import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the incoming data
    if (!data.metric || !data.value || !data.rating) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value, rating' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store this data in your analytics database
    // 2. Aggregate metrics for performance monitoring
    // 3. Set up alerts for poor performance
    
    // For now, we'll just log it (in production, use a proper logging service)
    console.log('Web Vitals metric received:', {
      metric: data.metric,
      value: data.value,
      rating: data.rating,
      connection: data.connection,
      deviceMemory: data.deviceMemory,
      hardwareConcurrency: data.hardwareConcurrency,
      timestamp: data.timestamp,
    });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}