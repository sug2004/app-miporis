import User from '../models/UserModel.js';

const validateAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // User is an admin, proceed
    next();
  } catch (error) {
    console.error('Admin validation error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default validateAdmin; 