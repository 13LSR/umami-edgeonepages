import { startOfHour, startOfMonth } from 'date-fns';
import { hash, uuid } from '@/lib/crypto';

export function getSessionId(
  sourceId: string,
  distinctId: string | undefined,
  ip: string,
  userAgent: string,
  createdAt: Date,
) {
  if (distinctId) {
    return uuid(sourceId, distinctId);
  }

  const sessionSalt = hash(startOfMonth(createdAt).toUTCString());

  return uuid(sourceId, ip, userAgent, sessionSalt);
}

export function getVisitId(sessionId: string, createdAt: Date) {
  const visitSalt = hash(startOfHour(createdAt).toUTCString());

  return uuid(sessionId, visitSalt);
}
