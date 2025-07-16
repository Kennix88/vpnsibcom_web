import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker and monitoring systems
 * @returns Status information about the application
 */
export async function GET() {
  // Basic health information
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0-beta',
    environment: process.env.NODE_ENV,
  }

  return NextResponse.json(healthInfo, { status: 200 })
}
