const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const {
  attachCookiesToResponse,
  createTokenUser,
  checkPermission,
} = require('../utils');

const getAllUsers = async (req, res) => {
  const user = await User.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK).json({ user, count: user.length });
};

const getSignleUser = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findOne({ _id: userId }).select('-password');
  if (!user) {
    throw new CustomError.NotFoundError(`No users found with this ${userId}`);
  }
  checkPermission(req.user, user._id);
  res.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

const updateUser = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new CustomError.BadRequestError(
      'Please provide a valid name and email'
    );
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user.userId },
    { name, email },
    {
      new: true,
      runValidators: true,
    }
  );
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError(
      'Please provide old and new password'
    );
  }

  const user = await User.findOne({ _id: req.user.userId });

  const isCorrectPassword = await user.comparePassword(oldPassword);
  if (!isCorrectPassword) {
    throw new CustomError.UnauthenticatedError('Invalid Creditnials');
  }

  user.password = newPassword;
  await user.save();
  res
    .status(StatusCodes.OK)
    .json({ msg: 'Password has been successfully changed' });
};

module.exports = {
  getAllUsers,
  getSignleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
