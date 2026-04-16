const { offersUrl, redirects } = require('../utils/config');
const { getJson } = require('../utils/http');

function flattenOffers(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.comboOffers)) return response.comboOffers;
  if (Array.isArray(response?.activeCombos)) return response.activeCombos;
  return [];
}

function summarizeOffer(offer) {
  if (!offer || typeof offer !== 'object') return '';
  return (
    offer.comboName ||
    offer.offerName ||
    offer.name ||
    offer.title ||
    offer.itemName ||
    ''
  );
}

async function showOffers() {
  const apiResponse = await getJson(offersUrl);
  const offers = flattenOffers(apiResponse);
  const names = offers.map(summarizeOffer).filter(Boolean).slice(0, 3);

  return {
    success: true,
    message: names.length
      ? `Here are the latest offers on this website. Top offers are ${names.join(', ')}.`
      : 'Here are the latest offers available on this website.',
    action: 'OPEN_OFFERS_PAGE',
    redirectPage: redirects.offers,
    data: offers,
    raw: apiResponse
  };
}

module.exports = { showOffers };
