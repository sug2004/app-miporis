import express from 'express';
import { getUsersAnalytics, getAllUsersAnalyticsSummary, deleteUserByAdmin } from '../controllers/adminController.js';
import authenticateToken from '../middleware/index.js';
import validateAdmin from '../middleware/adminAuth.js';

const router = express.Router();

// Apply both authenticateToken and validateAdmin middleware to all admin routes
// authenticateToken verifies the JWT token and attaches the user to the request
// validateAdmin checks if the authenticated user has admin privileges

// Route to get detailed analytics for all users under an admin
router.get('/users-analytics', authenticateToken, getUsersAnalytics);

// Route to get summary analytics for all users under an admin
router.get('/users-analytics-summary', authenticateToken, getAllUsersAnalyticsSummary);

// Route to delete a user by admin
router.delete('/delete-user/:userId', authenticateToken, deleteUserByAdmin);

export default router;
