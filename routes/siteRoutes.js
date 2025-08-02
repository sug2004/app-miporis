import express from 'express';
import {
  getUserDetails,
  createUserDetails,
  updateUserDetails
} from '../controllers/siteController.js';

const router = express.Router();

// Get UserDetails by userId
router.get('/:userId', getUserDetails);

// Create new UserDetails
router.post('/', createUserDetails);

// Update existing UserDetails
router.put('/', updateUserDetails);

export default router;
