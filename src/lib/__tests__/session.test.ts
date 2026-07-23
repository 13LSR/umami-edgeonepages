import { getSessionId, getVisitId } from '../session';

const WEBSITE_ID = 'a42b1c7c-0b36-4ff2-a838-80d89a24ddff';
const USER_AGENT = 'Mozilla/5.0';
const CREATED_AT = new Date('2026-07-23T04:00:00.000Z');

beforeAll(() => {
  process.env.APP_SECRET = 'test-secret';
});

afterAll(() => {
  delete process.env.APP_SECRET;
});

test('getSessionId: Same visitor input is stable within the month', () => {
  const first = getSessionId(WEBSITE_ID, undefined, '203.0.113.10', USER_AGENT, CREATED_AT);
  const second = getSessionId(
    WEBSITE_ID,
    undefined,
    '203.0.113.10',
    USER_AGENT,
    new Date('2026-07-30T12:00:00.000Z'),
  );

  expect(second).toEqual(first);
});

test('getSessionId: Different IP creates a different visitor', () => {
  const first = getSessionId(WEBSITE_ID, undefined, '203.0.113.10', USER_AGENT, CREATED_AT);
  const second = getSessionId(WEBSITE_ID, undefined, '198.51.100.25', USER_AGENT, CREATED_AT);

  expect(second).not.toEqual(first);
});

test('getSessionId: Explicit distinct ID is independent from IP', () => {
  const first = getSessionId(WEBSITE_ID, 'reader-123', '203.0.113.10', USER_AGENT, CREATED_AT);
  const second = getSessionId(WEBSITE_ID, 'reader-123', '198.51.100.25', USER_AGENT, CREATED_AT);

  expect(second).toEqual(first);
});

test('getVisitId: Repeated pageviews in the same hour share a visit', () => {
  const sessionId = getSessionId(WEBSITE_ID, undefined, '203.0.113.10', USER_AGENT, CREATED_AT);
  const first = getVisitId(sessionId, CREATED_AT);
  const second = getVisitId(sessionId, new Date('2026-07-23T04:29:59.000Z'));

  expect(second).toEqual(first);
});
