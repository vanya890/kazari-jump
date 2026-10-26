import { EndpointError } from 'sdk';

// The client sends distance metres as both score and distance. Keep the checks
// generous enough for perfect runs but tight enough to reject obvious cheats.
const MAX_METRES_PER_SECOND = 52;
const MAX_SCORE = 200000;
const MAX_DURATION_MS = 30 * 60 * 1000;
const MIN_DURATION_MS = 250;
const MAX_COINS_PER_SECOND = 5;

function integer(value, field, max) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new EndpointError(`Invalid ${field}`, { code: 'INVALID_RUN' });
  }
  const rounded = Math.floor(number);
  if (rounded < 0 || rounded > max) {
    throw new EndpointError(`Invalid ${field}`, { code: 'INVALID_RUN' });
  }
  return rounded;
}

/**
 * Validate a submitted run and return clean integers.
 * Throws EndpointError with a machine-readable code on rejection.
 */
export function validateRun(input) {
  const score = integer(input?.score, 'score', MAX_SCORE);
  const distance = integer(input?.distance, 'distance', MAX_SCORE);
  const coins = integer(input?.coins, 'coins', 100000);
  const durationMs = integer(input?.durationMs, 'durationMs', MAX_DURATION_MS);

  if (score !== distance) {
    throw new EndpointError('Score and distance must match', { code: 'INVALID_RUN' });
  }
  if (durationMs < MIN_DURATION_MS) {
    throw new EndpointError('Run is too short', { code: 'INVALID_RUN' });
  }

  const seconds = durationMs / 1000;
  if (score > Math.floor(MAX_METRES_PER_SECOND * seconds + 60)) {
    throw new EndpointError('Impossible distance for this duration', { code: 'INVALID_RUN' });
  }
  if (coins > Math.floor(MAX_COINS_PER_SECOND * seconds) + 12) {
    throw new EndpointError('Impossible coin count for this duration', { code: 'INVALID_RUN' });
  }

  return { score, distance, coins, durationMs, revived: Boolean(input?.revived) };
}
