import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET!
const maxAge = Number(process.env.JWT_MAX_AGE || 300)

export type ClaimPayload = {
  nonce: string
  wallet: string
  eventId: string
  iat?: number
}

export function signClaim(p: ClaimPayload) {
  return jwt.sign(p, secret, { expiresIn: maxAge })
}

export function verifyClaim(token: string): ClaimPayload {
  return jwt.verify(token, secret) as ClaimPayload
}
