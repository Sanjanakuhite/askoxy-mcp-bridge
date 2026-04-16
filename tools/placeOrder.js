const { orderUrl, redirects } = require('../utils/config');
const { postJson } = require('../utils/http');

async function placeOrder(args) {
  if (!orderUrl) {
    return {
      success: false,
      message: 'ORDER_URL is not configured in .env.',
      action: 'NO_ACTION',
      redirectPage: null,
      data: null
    };
  }

  const body = { ...(args || {}) };
  if (body.userId && !body.customerId) {
    body.customerId = body.userId;
  }

  const apiResponse = await postJson(orderUrl, body);
  const orderId = apiResponse?.orderId || apiResponse?.data?.orderId || apiResponse?.id || '';

  return {
    success: true,
    message: orderId
      ? `Order placed successfully. Your order id is ${orderId}.`
      : 'Order placed successfully.',
    action: 'OPEN_ORDER_PAGE',
    redirectPage: redirects.order,
    data: apiResponse
  };
}

module.exports = { placeOrder };
