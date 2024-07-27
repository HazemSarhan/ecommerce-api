const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating'],
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Please provide a review title'],
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review text'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// static method to calculate the average rating and number of reviews
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);
  console.log(result); // [ { _id: null, averageRating: number, numOfReviews: number } ] : empty array
  try {
    await this.model('Product').findOneAndUpdate(
      { _id: productId },
      {
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

// hook upadte review
ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product); // <= from the static method
  console.log('post save hook called');
});

// pre hook for findOneAndDelete review to get the document before deletion
ReviewSchema.pre('findOneAndDelete', async function (next) {
  this._doc = await this.model.findOne(this.getFilter());
  next();
});

// post hook for findOneAndDelete review
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await this.model.calculateAverageRating(doc.product); // <= from the static method
    console.log('post delete hook called');
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
