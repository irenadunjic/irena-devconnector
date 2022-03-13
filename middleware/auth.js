const jwt = require('jsonwebtoken');
const config = require('config');

// MIDDLEWARE FOR REGISTRATION AUTHENTICATION
// Verifies the token received in the registration request and either
// allows or denies user registration
module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if token doesn't exist
    if (!token) {
        return res.status(401).json({
            msg: 'No token, authorization denied.'
        })
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch(err) {
        res.status(401).json({
            msg: 'Token is not valid'
        });
    }
};