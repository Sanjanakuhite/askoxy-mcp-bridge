const { getCartUrl, redirects } = require('../utils/config');
const { getJson } = require('../utils/http');

function pickCartItems(response) {
  const candidates = [
    response?.customerCartResponseList,
    response?.items,
    response?.cartItems,
    response?.data?.customerCartResponseList,
    response?.data?.items,
    response?.data?.cartItems
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function summarizeCart(items) {
  if (!items.length) return 'Your cart is empty.';

  const preview = items
    .slice(0, 3)
    .map((item) => item?.itemName || item?.name || item?.productName)
    .filter(Boolean)
    .join(', ');

  return preview
    ? `Your cart has ${items.length} items. Top items are ${preview}.`
    : `Your cart has ${items.length} items.`;
}

async function showCart({ userId, customerId }) {
  const finalCustomerId = String(customerId || userId || '').trim();
  if (!finalCustomerId) {
    return {
      success: false,
      message: 'customerId or userId is required to show cart.',
      action: 'NO_ACTION',
      redirectPage: null,
      data: []
    };
  }

  const url = `${getCartUrl}?customerId=${encodeURIComponent(finalCustomerId)}`;
  const apiResponse = await getJson(url);
  const items = pickCartItems(apiResponse);

  return {
    success: true,
    message: summarizeCart(items),
    action: 'OPEN_CART_PAGE',
    redirectPage: redirects.cart,
    data: items,
    raw: apiResponse
  };
}

module.exports = { showCart };
