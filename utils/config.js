const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requireEnv(name, fallback = '') {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 3001),
  openAiApiKey: requireEnv('OPENAI_API_KEY'),
  openAiRealtimeModel: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-1',
  openAiRealtimeVoice: process.env.OPENAI_REALTIME_VOICE || 'alloy',
  searchUrl: process.env.SEARCH_URL || 'https://meta.oxyloans.com/api/product-service/dynamicSearch',
  offersUrl: process.env.OFFERS_URL || 'https://meta.oxyloans.com/api/product-service/getComboActiveInfo',
  addToCartUrl: process.env.ADD_TO_CART_URL || 'https://meta.oxyloans.com/api/cart-service/cart/addAndIncrementCart',
  getCartUrl: process.env.GET_CART_URL || 'https://meta.oxyloans.com/api/cart-service/cart/userCartInfo',
  orderUrl: process.env.ORDER_URL || '',
  redirects: {
    searchBase: process.env.SEARCH_REDIRECT_BASE || '/main/search-main?q=',
    offers: process.env.OFFERS_REDIRECT || '/offers',
    cart: process.env.CART_REDIRECT || '/main/mycart',
    order: process.env.ORDER_REDIRECT || '/thank-you'
  }
};
