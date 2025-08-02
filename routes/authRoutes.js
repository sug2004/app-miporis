import express from 'express';
import { googleAuth, loginUser, getUsersByAdmin, registerUser, registerAdmin, changePassword, forgotPassword, resetPassword, checkSubscriptionValidity, registerUserByAdmin, loginAdmin, getTeamMembersByUser } from '../controllers/authController.js';
import User from '../models/UserModel.js';
import authenticateToken from '../middleware/index.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/admin/login', loginAdmin);
router.post('/admin/register', registerAdmin);
router.get('/admin/sub-user', authenticateToken, getUsersByAdmin);
router.post('/admin/add-user', authenticateToken, registerUserByAdmin);
router.post('/change-password', changePassword);
router.post('/google-auth', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/subscription/validity', checkSubscriptionValidity);
router.get('/user-details/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/team-members', authenticateToken, getTeamMembersByUser);


export default router;
