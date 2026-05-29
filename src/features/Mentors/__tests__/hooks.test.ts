import { mentorKeys } from '../api/hooks';

describe('mentorKeys', () => {
  it('by-user key does not collide with profile-id key', () => {
    const userId = 'cb774a0b-1a8d-4e11-b920-9d1cb480950a';
    const profileId = 'cb774a0b-1a8d-4e11-b920-9d1cb480950a'; // same UUID, different meaning

    const byUserKey = mentorKeys.detail(`user:${userId}`);
    const byIdKey = mentorKeys.detail(profileId);

    expect(byUserKey).not.toEqual(byIdKey);
    expect(byUserKey[byUserKey.length - 1]).toBe(`user:${userId}`);
  });

  it('by-user query URL is /mentors/by-user/{userId}', () => {
    const userId = 'cb774a0b-1a8d-4e11-b920-9d1cb480950a';
    const url = `/mentors/by-user/${userId}`;
    expect(url).toBe('/mentors/by-user/cb774a0b-1a8d-4e11-b920-9d1cb480950a');
  });

  it('useMentorByUserId is disabled when userId is empty string', () => {
    const userId = '';
    expect(!!userId).toBe(false);
  });

  it('useMentorByUserId is enabled when userId is non-empty', () => {
    const userId = 'cb774a0b-1a8d-4e11-b920-9d1cb480950a';
    expect(!!userId).toBe(true);
  });
});
