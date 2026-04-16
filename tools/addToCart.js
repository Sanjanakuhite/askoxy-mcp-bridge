const { addToCartUrl, redirects } = require('../utils/config');
const { postJson } = require('../utils/http');

function buildBody(args) {
  const quantity = Number(args.quantity || 1);
  return {
    itemId: args.itemId,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    customerId: args.customerId || args.userId
  };
}

async function addToCart(args) {
  const body = buildBody(args || {});

  if (!body.itemId) {
    return {
      success: false,
      message: 'itemId is required to add product to cart.',
      action: 'NO_ACTION',
      redirectPage: null,
      data: null
    };
  }

  if (!body.customerId) {
    return {
      success: false,
      message: 'customerId or userId is required to add product to cart.',
      action: 'NO_ACTION',
      redirectPage: null,
      data: null
    };
  }

  const apiResponse = await postJson(addToCartUrl, body);

  return {
    success: true,
    message: 'Item added to cart successfully.',
    action: 'OPEN_CART_PAGE',
    redirectPage: redirects.cart,
    data: apiResponse
  };
}

module.exports = { addToCart };
