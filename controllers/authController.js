import bcrypt from 'bcryptjs';
import User from '../models/UserModel.js';
import { generateTokens } from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import sendMailTo from '../utils/sendMail.js';
import AdminUserRelation from '../models/adminUserModel.js';
import Stripe from 'stripe';

const stripe = Stripe(process.env.stripe_secret);


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean(); // lean() makes it a plain JS object

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPaid = user.hasAccess;
    const tokens = generateTokens(user);
    const { passwordHash, resetPasswordPin, resetPinExpiry, ...safeUser } = user;

    res.json({ isPaid, token: tokens.token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', errorq: err.message });
  }
};

// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     const user = await User.findOne({ email }).lean();

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     if (user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
//     }

//     const tokens = generateTokens(user);
//     const { passwordHash, resetPasswordPin, resetPinExpiry, ...safeUser } = user;

//     res.json({ 
//       hasAccess: true, 
//       token: tokens.token, 
//       user: safeUser 
//     });
//   } catch (err) {
//     console.error('Admin login error:', err);
//     res.status(500).json({ error: 'Internal server error', errorq: err.message });
//   }
// };

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has a password hash
    if (!user.passwordHash) {
      return res.status(401).json({ 
        message: 'Account created via payment. Please reset your password first.' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check for Enterprise price ID instead of role
    const enterprisePriceIds = [
      process.env.Enterprise_monthly
    ];

    if (!enterprisePriceIds.includes(user.priceId)) {
      return res.status(403).json({ 
        message: 'Access denied. Enterprise plan required for admin access.'
      });
    }

    const tokens = generateTokens(user);
    const { passwordHash, resetPasswordPin, resetPinExpiry, ...safeUser } = user;

    res.json({ 
      hasAccess: true, 
      token: tokens.token, 
      user: safeUser 
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error', errorq: err.message });
  }
};




export const registerUser = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash: hashedPassword, userName });
    const userData = await user.save();
    const tokens = generateTokens(user);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', errorq: err });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    
    if (!email || !password || !userName) {
      return res.status(400).json({ message: 'Email, password, and userName are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      passwordHash: hashedPassword, 
      userName, 
      role: 'user',
      hasAccess: false 
    });
    
    await user.save();

    // Create Stripe checkout session for Enterprise plan
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [{
        price: process.env.Enterprise_monthly,
        quantity: 1,
      }],
      customer_email: email,
      mode: 'subscription',
      success_url: `${process.env.Miporis}/success`,
      cancel_url: `${process.env.Miporis}/cancel`,
      metadata: {
        userId: user._id.toString(),
        planId: 'Enterprise-monthly'
      },
    });
    
    res.status(201).json({ 
      message: 'User created. Redirecting to Enterprise plan payment.',
      paymentUrl: session.url,
      userId: user._id
    });
  } catch (err) {
    console.error('Register admin error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};






// export const registerAdmin = async (req, res) => {
//   try {
//     const { email, password, userName } = req.body;
    
//     if (!email || !password || !userName) {
//       return res.status(400).json({ message: 'Email, password, and userName are required' });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ 
//       email, 
//       passwordHash: hashedPassword, 
//       userName, 
//       role: 'superadmin',
//       hasAccess: true 
//     });
    
//     await user.save();
//     const tokens = generateTokens(user);
//     const { passwordHash: _, resetPasswordPin, resetPinExpiry, ...safeUser } = user.toObject();
    
//     res.status(201).json({ 
//       message: 'Admin created successfully',
//       token: tokens.token,
//       user: safeUser 
//     });
//   } catch (err) {
//     console.error('Register admin error:', err);
//     res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// };


// export const registerUserByAdmin = async (req, res) => {
//   try {
//     const { email, password, userName } = req.body;
//     const adminId = req.user.id;
//     if (!adminId) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       email,
//       passwordHash: hashedPassword,
//       userName,
//       role: 'user',
//     });
//     const newUser = await user.save();

//     const relation = new AdminUserRelation({
//       adminId,
//       userId: newUser._id,
//     });
//     await relation.save();

//     // Send email with credentials to the new user
//     await sendMailTo(email, null, null, password);

//     res.status(201).json({ message: 'User created successfully', user: newUser });
//   } catch (err) {
//     res.status(500).json({ error: 'Internal server error', details: err });
//   }
// };


export const registerUserByAdmin = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    const adminId = req.user.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      passwordHash: hashedPassword,
      userName,
      role: 'user',
    });
    const newUser = await user.save();

    const relation = new AdminUserRelation({
      adminId,
      userId: newUser._id,
    });
    await relation.save();

    // Send email with credentials to the new user
    try {
      await sendMailTo(email, null, null, password);
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error('Error in registerUserByAdmin:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};



export const getUsersByAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;
    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const relations = await AdminUserRelation.find({ adminId }).populate('userId', '-passwordHash -resetPasswordPin -resetPinExpiry');
    const users = relations.map(relation => ({
      ...relation.userId.toObject(),
      createdAt: relation.createdAt,
    }));

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, given_name, family_name } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        userName: `${given_name} ${family_name}`,
        authSource: 'google',
      });
      await user.save();
    }

    const token = generateTokens(user);
    res.status(200).json(token);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
};


const generatePin = () => Math.floor(100000 + Math.random() * 900000); // 6-digit PIN

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pin = generatePin();
    user.resetPasswordPin = String(pin);
    user.resetPinExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();
    try {
      await sendMailTo(email, pin);
      res.status(200).json({ message: 'PIN sent to your email address' });
    } catch (mailError) {
      console.error('Error sending email:', mailError);
      res.status(500).json({ message: 'Failed to send PIN email. Please try again later.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPin = String(pin);
    if (
      hashedPin !== user.resetPasswordPin ||
      Date.now() > user.resetPinExpiry
    ) {
      return res.status(400).json({ message: 'Invalid or expired PIN' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;

    user.resetPasswordPin = undefined;
    user.resetPinExpiry = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkSubscriptionValidity = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ isValid: user.hasAccess });
  } catch (error) {
    console.error('Error checking subscription validity:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// export const getTeamMembersByUser = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     // Check if current user is an admin
//     const currentUser = await User.findById(userId);
    
//     if (!currentUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     let teamMembers = [];

//     // Check for Enterprise price ID instead of role
//     const enterprisePriceIds = [
//       process.env.Enterprise_monthly,
//       'price_1QognHQ0hqQaD2vKOXJMagNb',
//       'price_1RXGKOQ0hqQaD2vKyBXsMank'
//     ];

//     if (enterprisePriceIds.includes(currentUser.priceId)) {
//       // If user has Enterprise plan, get all users under this admin
//       const relations = await AdminUserRelation.find({ adminId: userId }).populate('userId', 'userName email hasAccess createdAt');
      
//       teamMembers = relations.map(relation => ({
//         id: relation.userId._id,
//         name: relation.userId.userName,
//         email: relation.userId.email,
//         status: relation.userId.hasAccess ? 'Active' : 'Inactive',
//         joinedAt: relation.createdAt
//       }));
//     } else {
//       // If user is regular user, find their admin and get all users under that admin
//       const userRelation = await AdminUserRelation.findOne({ userId }).populate('adminId');
      
//       if (userRelation) {
//         const adminId = userRelation.adminId._id;
//         const relations = await AdminUserRelation.find({ adminId }).populate('userId', 'userName email hasAccess createdAt');
        
//         teamMembers = relations.map(relation => ({
//           id: relation.userId._id,
//           name: relation.userId.userName,
//           email: relation.userId.email,
//           status: relation.userId.hasAccess ? 'Active' : 'Inactive',
//           joinedAt: relation.createdAt
//         }));
//       } else {
//         // If no admin relation found, return just the current user
//         teamMembers = [{
//           id: currentUser._id,
//           name: currentUser.userName,
//           email: currentUser.email,
//           status: currentUser.hasAccess ? 'Active' : 'Inactive',
//           joinedAt: currentUser.createdAt
//         }];
//       }
//     }

//     res.status(200).json({ teamMembers });
//   } catch (error) {
//     console.error('Error fetching team members:', error);
//     res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// };


export const getTeamMembersByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let teamMembers = [];

    const enterprisePriceIds = [
      process.env.Enterprise_monthly,
      'price_1QognHQ0hqQaD2vKOXJMagNb',
      'price_1RXGKOQ0hqQaD2vKyBXsMank'
    ];

    if (enterprisePriceIds.includes(currentUser.priceId)) {
      // For admin: show team members under this admin (excluding current admin)
      const relations = await AdminUserRelation.find({ adminId: userId }).populate('userId', 'userName email hasAccess createdAt');
      
      teamMembers = relations.map(relation => ({
        id: relation.userId._id,
        name: relation.userId.userName,
        email: relation.userId.email,
        status: relation.userId.hasAccess ? 'Active' : 'Inactive',
        joinedAt: relation.createdAt,
        role: 'Member'
      }));
    } else {
      // For regular users: always show admin first, then other team members (excluding current user)
      const userRelation = await AdminUserRelation.findOne({ userId }).populate('adminId');
      
      if (userRelation) {
        const adminId = userRelation.adminId._id;
        const admin = userRelation.adminId;
        
        // Always add admin first
        teamMembers.push({
          id: admin._id,
          name: admin.userName,
          email: admin.email,
          status: admin.hasAccess ? 'Active' : 'Inactive',
          joinedAt: admin.createdAt,
          role: 'Admin'
        });

        // Add other team members under this admin (excluding current user)
        const relations = await AdminUserRelation.find({ adminId }).populate('userId', 'userName email hasAccess createdAt');
        
        const subMembers = relations
          .filter(relation => relation.userId._id.toString() !== userId) // Exclude current user
          .map(relation => ({
            id: relation.userId._id,
            name: relation.userId.userName,
            email: relation.userId.email,
            status: relation.userId.hasAccess ? 'Active' : 'Inactive',
            joinedAt: relation.createdAt,
            role: 'Member'
          }));

        teamMembers = [...teamMembers, ...subMembers];
      }
    }

    res.status(200).json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



