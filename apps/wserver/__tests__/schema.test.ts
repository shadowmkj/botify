import { sendTextSchema } from '../src/schema/messageSchema';

describe('wserver messageSchema', () => {
  it('should validate correct payload', () => {
    const validData = {
      token: '919999999999',
      number: '918888888888',
      text: 'Hello from Botify',
      type: 'text',
    };

    const res = sendTextSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it('should fail if token is not digits', () => {
    const invalidData = {
      token: 'invalid_token',
      number: '918888888888',
      text: 'Hello',
    };

    const res = sendTextSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it('should fail if number is not digits', () => {
    const invalidData = {
      token: '919999999999',
      number: 'not-a-number',
      text: 'Hello',
    };

    const res = sendTextSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it('should fail if text is empty', () => {
    const invalidData = {
      token: '919999999999',
      number: '918888888888',
      text: '',
    };

    const res = sendTextSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });
});
