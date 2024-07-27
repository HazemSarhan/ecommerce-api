const Review = require('../models/Review');
const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermission } = require('../utils');

const createReview = async (req, res) => {
  const { product: productId } = req.body; // get productId
  // check for product availablity
  const isValidProduct = await Product.findOne({ _id: productId });
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(
      `No product with this id => ${productId}`
    );
  }

  // check for user submitted a review before or not !
  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });
  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Already submitted review for this product'
    );
  }

  req.body.user = req.user.userId; // attach userId to body {from Review => user "id is needed"}
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  const reviews = await Review.find({})
    .populate({
      path: 'product',
      select: 'name company price',
    })
    .populate({
      path: 'user',
      select: 'name',
    });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReview = async (req, res) => {
  const reviewId = req.params.id;
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new CustomError.NotFoundError(
      `No review with this id => ${reviewId}`
    );
  }
  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const reviewId = req.params.id;
  const { rating, title, comment } = req.body;
  /*
  const review = await Review.findOneAndUpdate(
    { _id: reviewId },
    { rating, title, comment },
    { new: true, runValidators: true }
  );
  */
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No reviews with this ${reviewId}`);
  }
  checkPermission(req.user, review.user);

  review.rating = rating;
  review.title = title;
  review.comment = comment;
  await review.save();

  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const reviewId = req.params.id;
  const review = await Review.findOneAndDelete({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No reviews with this ${reviewId}`);
  }
  if (review.deletedCount === 0) {
    throw new CustomError.NotFoundError('Review not found');
  }
  checkPermission(req.user, review.user);
  res
    .status(StatusCodes.OK)
    .json({ msg: `Review has been removed successfully!` });
};

const getSingleProductReviews = async (req, res) => {
  const productId = req.params.id;
  const reviews = await Review.find({ product: productId });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
