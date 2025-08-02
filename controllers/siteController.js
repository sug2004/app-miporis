import Site from '../models/SiteModel.js';
import connectDB from '../utils/connectDB.js';

export const getUserDetails = async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;
        const userDetails = await Site.findOne({ userId });

        if (!userDetails) {
            return res.status(200).json({ message: 'UserDetails not found' });
        }

        res.status(200).json({ data: userDetails, message: "success" });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create new UserDetails
export const createUserDetails = async (req, res) => {
    await connectDB();
    try {
        const { userId, idSite, url, websiteName } = req.body;

        const newUserDetails = new Site({
            userId,
            idSite,
            url,
            websiteName,
        });

        await newUserDetails.save();
        res.status(200).json(newUserDetails);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update UserDetails
export const updateUserDetails = async (req, res) => {
    await connectDB();
    try {
        const { userId, url, websiteName } = req.body;

        const userDetails = await Site.findOneAndUpdate(
            { userId },
            { url, websiteName },
            { new: true }
        );

        if (!userDetails) {
            return res.status(404).json({ message: 'UserDetails not found' });
        }

        res.status(200).json(userDetails);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
