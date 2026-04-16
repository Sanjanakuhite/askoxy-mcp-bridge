const { z } = require('zod');
const { toolResult } = require('../utils/response');
const { searchProduct } = require('../tools/searchProduct');
const { showOffers } = require('../tools/showOffers');
const { showCart } = require('../tools/showCart');
const { addToCart } = require('../tools/addToCart');
const { placeOrder } = require('../tools/placeOrder');

const toolDefinitions = [
  {
    name: 'search_product',
    description: 'Search products from the ecommerce website and return grounded results.',
    inputSchema: {
      query: z.string().min(1).describe('Product search text spoken by the user')
    },
    handler: searchProduct
  },
  {
    name: 'show_offers',
    description: 'Fetch latest active combo offers from the ecommerce website.',
    inputSchema: {},
    handler: showOffers
  },
  {
    name: 'show_cart',
    description: 'Fetch current cart items for the given customer.',
    inputSchema: {
      userId: z.string().optional().describe('User id if available'),
      customerId: z.string().optional().describe('Customer id if available')
    },
    handler: showCart
  },
  {
    name: 'add_to_cart',
    description: 'Add a specific product item to the customer cart.',
    inputSchema: {
      itemId: z.string().min(1).describe('Item id of the selected product'),
      quantity: z.number().int().positive().optional().describe('Quantity to add'),
      userId: z.string().optional().describe('User id if available'),
      customerId: z.string().optional().describe('Customer id if available')
    },
    handler: addToCart
  },
  {
    name: 'place_order',
    description: 'Place an order using backend grounded order payload fields.',
    inputSchema: {
      userId: z.string().optional(),
      customerId: z.string().optional(),
      address: z.string().optional(),
      flatNo: z.string().optional(),
      landMark: z.string().optional(),
      pincode: z.string().optional(),
      orderStatus: z.string().optional(),
      orderFrom: z.string().optional(),
      amount: z.number().optional(),
      subTotal: z.number().optional(),
      handlingFee: z.number().optional(),
      gstAmount: z.number().optional(),
      deliveryBoyFee: z.number().optional(),
      couponCode: z.string().nullable().optional(),
      couponValue: z.number().optional(),
      walletAmount: z.number().optional(),
      expectedDeliveryDate: z.string().optional(),
      timeSlot: z.string().optional(),
      dayOfWeek: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      paymentType: z.number().optional()
    },
    handler: placeOrder
  }
];

function registerTools(server) {
  for (const tool of toolDefinitions) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      async (args) => toolResult(await tool.handler(args || {}))
    );
  }
}

async function invokeDebugTool(name, args) {
  const tool = toolDefinitions.find((item) => item.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return await tool.handler(args || {});
}

module.exports = {
  registerTools,
  invokeDebugTool,
  toolDefinitions
};
