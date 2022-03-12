const config = require('config')
const express = require("express");
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator/check");
const router = express.Router();

// Import User model
const User = require('../../models/User');

// @route  POST api/users
// @desc   Register a new user
// @access Public
router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty(),
    check("email", "Please include a valid email")
      .isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // This first block validates only whether all required fields have been submitted
    // Actual content of each field is not verified until the following try/catch block
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // USER REGISTRATION:
    const { name, email, password } = req.body;
    try {
        // 1. Search within User schema to check for duplicate emails
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                errors: [{ 
                    msg: "User already exists" 
                }] 
            });
        }

        // 2. Get user's Gravatar
        const avatar = gravatar.url(email, {
            s: '200', // Avatar size
            r: 'pg', // Avatar rating (censor)
            d: 'mm' // Default
        });
        // This only creates a new User but doesn't save to database - need to encrypt password first
        user = new User({
            name,
            email,
            avatar,
            password
        });

        // 3. Encrypt password - ensures user is logged in immediately after registration
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save new user to database
        await user.save();

        // 4. Return JSON webtoken
        const payload = {
            user: {
                id: user.id // Retrieved from Promise returned by user.save() - unique id in DB
            }
        }
        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Return secure token back to user, gets processed by auth
            }
        );
    } catch(err) {
        // If try/catch fails here, will be due to server error
        console.error(err.message);
        res.status(500).send('Server error');
    }
  }
);

module.exports = router;
