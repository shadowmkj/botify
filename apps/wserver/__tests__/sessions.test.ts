import sessions, { clients } from '../src/utils/sessions';

describe('wserver sessions map', () => {
  it('should export clients Map instance', () => {
    expect(sessions).toBeInstanceOf(Map);
    expect(clients).toBeInstanceOf(Map);
    expect(sessions).toBe(clients);
  });
});
