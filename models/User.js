const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'must provide a valid name'],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'must provide a valid email'],
    validate: {
      validator: validator.isEmail,
      message: 'please provide a valid email',
    },
  },
  password: {
    type: String,
    required: [true, 'must provide a valid password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
});

// hashing password
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // if there's no password change , don't hash a new password for the user
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// comparing hash with the dehashed password
UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
