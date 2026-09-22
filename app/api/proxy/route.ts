import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for fetching external images to bypass CORS restrictions
 * This is particularly useful for Azure Blob Storage URLs
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameter
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    
    // Validate the URL is from an allowed domain
    // This is important for security to prevent the proxy from being abused
    const allowedDomains = [
      'oaidalleapiprodscus.blob.core.windows.net',
      'openai-labs-public-images-prod.azureedge.net'
    ];
    
    const urlObj = new URL(url);
    const isAllowedDomain = allowedDomains.some(domain => urlObj.hostname === domain);
    
    if (!isAllowedDomain) {
      return NextResponse.json({ 
        error: 'URL domain not allowed' 
      }, { status: 403 });
    }
    
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch image: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }
    
    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Return the image with appropriate content type
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      }
    });
    
  } catch (error) {
    console.error('Error in proxy route:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
} 