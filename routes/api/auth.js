const express = require('express');
const config = require('config')
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require("express-validator/check");
const router = express.Router();

// @route  GET api/auth
// @desc   Test route
// @access Public
router.get('/', auth, async (req, res) => {
    try {
        // Makes use of Mongoose functions for Schemas
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route  POST api/auth
// @desc   Authenticate existing user and get token
// @access Public
router.post(
    "/",
    [
      check("email", "Please include a valid email").isEmail(),
      check("password", "Password is required").exists()
    ],
    async (req, res) => {
      // This first block validates only whether all required fields have been submitted
      // Actual content of each field is not verified until the following try/catch block
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      // USER LOGIN AUTHENTICATION:
      const { email, password } = req.body;
      try {
          // See if user exists in the database
          let user = await User.findOne({ email });
          if (!user) {
              return res.status(400).json({ 
                  errors: [{ 
                      msg: "Invalid credentials" 
                  }] 
              });
          };

          // If user exists, check that input password matches
          // saved password for existing user
          // Bcrypt.compare() compares a password string to an encrypted password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(400).json({
                  errors: [{
                      msg: 'Invalid Credentials'
                  }]
              });
          }
  
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