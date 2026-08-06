import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import type { AuthProvider } from '@/modules/auth/auth.types'

const googleClient = new OAuth2Client(config.google.clientId)

type OAuthPayload = {
  email: string
  name: string
  sub: string
}

let appleJwksClient: ReturnType<typeof jwksClient> | null = null

function getAppleJwksClient() {
  if (!appleJwksClient) {
    appleJwksClient = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' })
  }
  return appleJwksClient
}

function getAppleSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    getAppleJwksClient().getSigningKey(kid, (err, key) => {
      if (err) reject(new AppError(401, 'Failed to fetch Apple signing key'))
      else resolve(key!.getPublicKey())
    })
  })
}

async function verifyAppleToken(idToken: string): Promise<OAuthPayload> {
  const decoded = jwt.decode(idToken, { complete: true })
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new AppError(401, 'Invalid Apple token')
  }

  const publicKey = await getAppleSigningKey(decoded.header.kid)

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: config.apple.clientId,
  }) as jwt.JwtPayload

  if (!payload.sub || !payload.email) {
    throw new AppError(401, 'Apple token missing required claims')
  }

  return {
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    sub: payload.sub,
  }
}

async function verifyGoogleToken(idToken: string): Promise<OAuthPayload> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      throw new AppError(401, 'Google token missing required claims')
    }
    return {
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0],
      sub: payload.sub,
    }
  } catch {
    throw new AppError(401, 'Invalid Google token')
  }
}

export async function verifyOAuthToken(
  provider: AuthProvider,
  token: string,
): Promise<OAuthPayload> {
  if (provider === 'google') return verifyGoogleToken(token)
  return verifyAppleToken(token)
}
