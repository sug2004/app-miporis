import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.userName, subscription: user.subscription },
    process.env.JWT_SECRET,
    { expiresIn: '1week' }
  );
  return { token };
};
