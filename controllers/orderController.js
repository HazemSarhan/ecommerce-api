const Order = require('../models/Order');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermission } = require('../utils');

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = 'someRandomValue';
  return { client_secret, amount };
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new CustomError.NotFoundError(
      `No order found with this id => ${orderId}`
    );
  }
  checkPermission(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrder = async (req, res) => {
  const order = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ order, numOfOrders: order.length });
};

const createOrder = async (req, res) => {
  const { items, tax, shippingFee } = req.body;
  // check for items availablity
  if (!items || items.length < 1) {
    throw new CustomError.BadRequestError('No cart items provided');
  }

  // check for tax && shipping fees
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      'Please provide tax && shipping fees'
    );
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product found with this id => ${item.product}`
      );
    }

    const { name, price, image, _id } = dbProduct;
    const signleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };

    // add the item to order
    orderItems = [...orderItems, signleOrderItem];

    // calculate subtotal
    subtotal += item.amount * price;

    // console.log(orderItems);
    // console.log(subtotal);
  }

  // stripe payment , get the total and client secret first
  const total = tax + shippingFee + subtotal;
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: 'usd',
  });

  // create order
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const updateOrder = async (req, res) => {
  const orderId = req.params.id;
  const { paymentIntentId } = req.body;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(
      `No order found with this id => ${orderId}`
    );
  }

  checkPermission(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = 'paid';
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrder,
  createOrder,
  updateOrder,
};
