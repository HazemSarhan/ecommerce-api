const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

const createProduct = async (req, res) => {
  req.body.user = req.user.userId;
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (req, res) => {
  const products = await Product.find({});
  res.status(StatusCodes.OK).json({ products, count: products.length });
};

const getSingleProduct = async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId).populate('reviews');
  if (!product) {
    throw new CustomError.NotFoundError(
      `No products found with this id => ${productId}`
    );
  }
  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    throw new CustomError.NotFoundError(
      `No products found with this id => ${productId}`
    );
  }
  res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) {
    throw new CustomError.NotFoundError(
      `No products found with this id => ${productId}`
    );
  }

  // delete product and reviews from model pre('deleteOne')
  await product.deleteOne();
  if (product.deletedCount === 0) {
    throw new CustomError.NotFoundError('Product not found');
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: `Product has been removed successfully with reviews!` });
};

const uploadImage = async (req, res) => {
  // console.log(req.files); => For sure image logging
  if (!req.files) {
    throw new CustomError.BadRequestError('No File Uploaded!');
  }

  const productImage = req.files.image;
  if (!productImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please Upload Image!');
  }

  const maxSize = 1024 * 1024;
  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError(
      'Please Upload Image Smaller Than 1MB!'
    );
  }

  const imagePath = path.join(
    __dirname,
    '../public/uploads/' + `${productImage.name}`
  );
  await productImage.mv(imagePath);
  res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
