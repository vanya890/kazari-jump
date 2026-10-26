import { api, EndpointError } from 'sdk';
import { productById, productDescription, productTitle } from '../lib/catalog.js';
import { payloadFor } from '../lib/payments.js';
import { ensureProfile } from '../lib/profiles.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const product = productById(input?.productId);
  if (!product || !product.priceStars) {
    throw new EndpointError('Not for sale', { code: 'NOT_FOR_SALE' });
  }

  const row = (await ensureProfile(user, null)) ?? null;
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const owned = Array.isArray(row.ownedSkins) ? row.ownedSkins : ['classic'];
  if (product.unique && row.supporter) {
    throw new EndpointError('Already owned', { code: 'ALREADY_OWNED' });
  }
  if (product.kind === 'skin' && product.skinId && owned.includes(product.skinId)) {
    throw new EndpointError('Already owned', { code: 'ALREADY_OWNED' });
  }

  const lang = row.lang === 'en' ? 'en' : 'ru';
  const title = productTitle(product, lang);
  const description = productDescription(product, lang);

  try {
    const url = await api.createInvoiceLink({
      title,
      description,
      payload: payloadFor(product.id, row.id, row.tgId),
      currency: 'XTR',
      prices: [{ label: title, amount: product.priceStars }],
    });
    if (!url) throw new Error('Empty invoice link');
    return { url };
  } catch (error) {
    console.error('createInvoiceLink failed', { product: product.id, error: error?.description ?? error?.message });
    throw new EndpointError('Stars checkout is unavailable', { code: 'STARS_UNAVAILABLE' });
  }
}
