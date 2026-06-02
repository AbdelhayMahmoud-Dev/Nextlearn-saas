import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
} from '../../services/token.service';

describe('token.service', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({
      sub: '507f1f77bcf86cd799439011',
      tenantId: '507f1f77bcf86cd799439012',
      role: 'student',
      email: 'a@b.com',
    });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('507f1f77bcf86cd799439011');
    expect(decoded.role).toBe('student');
  });

  it('signs and verifies a refresh token with jti', () => {
    const token = signRefreshToken({
      sub: '507f1f77bcf86cd799439011',
      tenantId: '507f1f77bcf86cd799439012',
      jti: 'abc123',
    });
    expect(verifyRefreshToken(token).jti).toBe('abc123');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({
      sub: 'x',
      tenantId: 'y',
      role: 'student',
      email: 'a@b.com',
    });
    expect(() => verifyAccessToken(`${token}tamper`)).toThrow();
  });

  it('hashToken is deterministic and 64 hex chars (sha256)', () => {
    const a = hashToken('hello');
    expect(a).toBe(hashToken('hello'));
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generateRandomToken produces unique hex strings', () => {
    expect(generateRandomToken()).not.toBe(generateRandomToken());
  });
});
