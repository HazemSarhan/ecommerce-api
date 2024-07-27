const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  // check if the email existing or not
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists!');
  }

  // set the first registerd user as an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  // creating new user
  const user = await User.create({ name, email, password, role });
  const tokenUser = createTokenUser(user); // user info to send to JWT token
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
  // check for email && password existing
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide a valid username & password'
    );
  }

  // check for email validation
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Creditnials');
  }

  // check for password (hash, dehashed)
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Creditnials');
  }

  // create a new token & attack to cookies
  const tokenUser = createTokenUser(user); // user info to send to JWT token
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 5 * 1000),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out successfully!' });
};

module.exports = {
  register,
  login,
  logout,
};
