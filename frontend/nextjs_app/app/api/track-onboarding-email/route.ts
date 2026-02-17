import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const userId = searchParams.get('user_id')

  // Forward the request to Django backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const trackingUrl = `${backendUrl}/api/track-onboarding-email?token=${token}&user_id=${userId}`

  try {
    const response = await fetch(trackingUrl)
    
    if (response.ok) {
      // Return the pixel image
      const imageBuffer = await response.arrayBuffer()
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }
  } catch (error) {
    console.error('Error tracking onboarding email:', error)
  }

  // Return transparent 1x1 pixel even on error
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
