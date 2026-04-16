const { searchUrl, redirects } = require('../utils/config');
const { getJson } = require('../utils/http');

function pickProducts(response) {
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.data?.items)
      ? response.data.items
      : [];

  return items.map((item) => ({
    itemId: item?.itemId || item?.id || '',
    itemName: item?.itemName || item?.name || '',
    itemPrice: item?.itemPrice ?? item?.sellingPrice ?? item?.price ?? '',
    weight: item?.weight ?? '',
    units: item?.units ?? '',
    itemImage: item?.itemImage || item?.image || ''
  }));
}

function buildMessage(products, query) {
  if (!products.length) {
    return `No matching product found for ${query} on this website.`;
  }

  const names = products
    .slice(0, 3)
    .map((p) => p.itemName)
    .filter(Boolean)
    .join(', ');

  return names
    ? `I found ${products.length} products for ${query}. Top results are ${names}.`
    : `I found ${products.length} products for ${query}.`;
}

async function searchProduct({ query }) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) {
    return {
      success: false,
      message: 'Search query is required.',
      action: 'NO_ACTION',
      redirectPage: null,
      data: []
    };
  }

  const url = `${searchUrl}?q=${encodeURIComponent(cleanQuery)}`;
  const apiResponse = await getJson(url);
  const products = pickProducts(apiResponse);

  return {
    success: true,
    message: buildMessage(products, cleanQuery),
    action: 'OPEN_SEARCH_PAGE',
    redirectPage: `${redirects.searchBase}${encodeURIComponent(cleanQuery)}`,
    data: products,
    raw: apiResponse
  };
}

module.exports = { searchProduct };
