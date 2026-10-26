import { api } from 'sdk';
import { parsePayload } from '../lib/payments.js';
import { botLang, botText } from '../lib/i18n.js';

export default async function (query) {
  const data = parsePayload(query?.invoice_payload);
  const valid =
    Boolean(data) &&
    query?.currency === 'XTR' &&
    query?.total_amount === data?.product?.priceStars &&
    Number(query?.from?.id) === data?.tgId;

  if (!valid) {
    await api.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: botText(botLang(query?.from?.language_code), 'paymentError'),
    });
    return;
  }

  await api.answerPreCheckoutQuery({ pre_checkout_query_id: query.id, ok: true });
}
