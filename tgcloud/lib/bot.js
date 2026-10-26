import { api } from 'sdk';

let cachedUsername = null;
let cachedAt = 0;

/** The bot's @username, cached for an hour per isolate. */
export async function botUsername() {
  const now = Date.now();
  if (cachedUsername && now - cachedAt < 60 * 60 * 1000) return cachedUsername;
  try {
    const me = await api.getMe();
    cachedUsername = typeof me?.username === 'string' ? me.username : cachedUsername;
    cachedAt = now;
    return cachedUsername;
  } catch {
    return cachedUsername;
  }
}

export function miniAppLink(username, param) {
  if (!username) return '';
  const base = `https://t.me/${String(username).replace(/^@/, '')}`;
  return param ? `${base}?startapp=${encodeURIComponent(param)}` : base;
}
