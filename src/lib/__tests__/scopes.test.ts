import { hasScope, isMentor } from '../scopes';

describe('hasScope', () => {
  it('returns true when scope present', () => {
    expect(hasScope(['sessions:read', 'mentor:me'], 'mentor:me')).toBe(true);
  });
  it('returns false when scope absent', () => {
    expect(hasScope(['sessions:read'], 'mentor:me')).toBe(false);
  });
});

describe('isMentor', () => {
  it('true with mentor:me scope', () => {
    expect(isMentor(['mentor:me', 'sessions:read'])).toBe(true);
  });
  it('false without mentor:me scope', () => {
    expect(isMentor(['sessions:read'])).toBe(false);
  });
});
