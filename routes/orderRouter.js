const express = require('express');
const router = express.Router();
const {
  authenticatedUser,
  authorizePermissions,
} = require('../middleware/authentication');
const {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrder,
  createOrder,
  updateOrder,
} = require('../controllers/orderController');

router
  .route('/')
  .get([authenticatedUser, authorizePermissions('admin')], getAllOrders)
  .post(authenticatedUser, createOrder);

router.route('/showAllMyOrders').get(authenticatedUser, getCurrentUserOrder);

router
  .route('/:id')
  .get(authenticatedUser, getSingleOrder)
  .patch(authenticatedUser, updateOrder);

module.exports = router;
