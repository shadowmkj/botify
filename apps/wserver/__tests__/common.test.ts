import { verifyHmacSha256, generateGoodMorningMessage, sleep } from '../src/utils/common';
import crypto from 'crypto';

describe('wserver common utils', () => {
  describe('verifyHmacSha256', () => {
    it('should verify valid HMAC signature', () => {
      const secret = 'secret123';
      const payload = 'test-payload';
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload, 'utf8');
      const hexHmac = hmac.digest('hex');
      const base64Hmac = Buffer.from(hexHmac, 'hex').toString('base64');

      const isValid = verifyHmacSha256(secret, payload, base64Hmac);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid HMAC signature', () => {
      const secret = 'secret123';
      const payload = 'test-payload';
      const invalidBase64 = Buffer.from('00'.repeat(32), 'hex').toString('base64');

      const isValid = verifyHmacSha256(secret, payload, invalidBase64);
      expect(isValid).toBe(false);
    });
  });

  describe('generateGoodMorningMessage', () => {
    it('should return a morning greeting', () => {
      const msg = generateGoodMorningMessage();
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified duration', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });
});
