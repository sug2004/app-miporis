import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    // Retrieve the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expected format: 'Bearer TOKEN'

    if (!token) {
        return res.status(401).json({ message: 'Access token missing' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user; // Attach the decoded user information to the request object
        next();
    });
};

export default authenticateToken;
