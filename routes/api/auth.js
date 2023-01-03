const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('config');

const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');

/**
 * @route GET api/auth
 * @desc Test route
 * @access Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(401).send('Server error');
  }
});

/**
 * @route POST api/auth
 * @desc Authenticate user and get token
 * @access Public
 */
router.post(
  '/login',
  [
    check('phone', 'Phone number is required').isMobilePhone('en-IN'),
    check('password', 'Please enter a password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { phone, password } = req.body;

    try {
      let user = await User.findOne({ phone });

      /** check if user exists */
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      /** generate jwt token */
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (error, token) => {
          if (error) {
            throw error;
          }

          return res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
