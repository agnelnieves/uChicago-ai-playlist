import { NextRequest, NextResponse } from 'next/server';
import {
  hashIP,
  generateSessionToken,
  getClientIP,
  getSessionTokenFromRequest,
  getUserAgent,
  createResponseWithSession,
} from '@/lib/session';
import {
  getOrCreateUserByIpHash,
  getSessionWithUser,
  createSession,
  touchSession,
} from '@/lib/supabase/database';

/**
 * POST /api/session - Initialize or validate a session
 * 
 * This endpoint handles session management:
 * - If a valid session cookie exists, validates it and returns user info
 * - If no session exists, creates a new user (or finds existing by IP) and creates a session
 * 
 * Response includes the session cookie (HTTP-only)
 */
export async function POST(request: NextRequest) {
  try {
    const existingToken = getSessionTokenFromRequest(request);
    
    // Check if we have an existing valid session
    if (existingToken) {
      const sessionData = await getSessionWithUser(existingToken);
      
      if (sessionData) {
        // Valid session exists - update last_seen and return user info
        await touchSession(existingToken);
        
        return createResponseWithSession(
          {
            success: true,
            user: {
              id: sessionData.user.id,
              createdAt: sessionData.user.created_at,
            },
            session: {
              id: sessionData.session.id,
              createdAt: sessionData.session.created_at,
            },
            isNewSession: false,
          },
          existingToken
        );
      }
      // Invalid token - fall through to create new session
    }
    
    // No valid session - create new one
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    const userAgent = getUserAgent(request);
    
    // Get or create user by IP hash
    const user = await getOrCreateUserByIpHash(ipHash);
    
    // Generate new session token
    const sessionToken = generateSessionToken();
    
    // Create session in database
    const session = await createSession({
      user_id: user.id,
      session_token: sessionToken,
      user_agent: userAgent,
    });
    
    return createResponseWithSession(
      {
        success: true,
        user: {
          id: user.id,
          createdAt: user.created_at,
        },
        session: {
          id: session.id,
          createdAt: session.created_at,
        },
        isNewSession: true,
      },
      sessionToken
    );
  } catch (error) {
    console.error('Error in session initialization:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize session' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session - Get current session info
 * 
 * Returns information about the current session if valid,
 * or an error if no valid session exists.
 */
export async function GET(request: NextRequest) {
  try {
    const existingToken = getSessionTokenFromRequest(request);
    
    if (!existingToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No session found',
          authenticated: false,
        },
        { status: 401 }
      );
    }
    
    const sessionData = await getSessionWithUser(existingToken);
    
    if (!sessionData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid session',
          authenticated: false,
        },
        { status: 401 }
      );
    }
    
    // Update last_seen
    await touchSession(existingToken);
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: sessionData.user.id,
        createdAt: sessionData.user.created_at,
      },
      session: {
        id: sessionData.session.id,
        createdAt: sessionData.session.created_at,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get session',
        authenticated: false,
      },
      { status: 500 }
    );
  }
}

