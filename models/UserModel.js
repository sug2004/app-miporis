import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false,
  },
  priceId: {
    type: String,
  },
  sessionId: {
    type: String,
  },
  customerId: {
    type: String,
  },
  hasAccess: {
    type: Boolean,
    default: false
  },
  authSource: {
    type: String,
    enum: ['self', 'google'],
    default: 'self',
  },
  resetPasswordPin: { type: String },
  resetPinExpiry: { type: Number },
  role: {
    type: String,
    enum: ['user', 'superadmin'],
    default: 'user',
  },
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
