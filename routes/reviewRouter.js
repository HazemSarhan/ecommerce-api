const express = require('express');
const router = express.Router();
const { authenticatedUser } = require('../middleware/authentication');
const {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

router.route('/').get(getAllReviews).post([authenticatedUser], createReview);
router
  .route('/:id')
  .get(getSingleReview)
  .patch([authenticatedUser], updateReview)
  .delete([authenticatedUser], deleteReview);

module.exports = router;
