const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const config = require('config');
const auth = require('../../middleware/auth');

const router = express.Router();

const User = require('../../models/User');

/**
 * @route POST api/users
 * @desc Register user
 * @access Public
 */
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty(),
    check('role', 'Role is required').notEmpty(),
    check('phone', 'Phone number is required').isMobilePhone('en-IN'),
    check('password', 'Please enter a password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { name, phone, password, role } = req.body;

    try {
      let user = await User.findOne({ phone });

      /** check if user exists */
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        role,
        phone,
        password,
      });

      /** encrypt password */
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

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

/**
 * @route GET api/users
 * @desc Get all users
 * @access private
 */
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET api/users/:userId
 * @desc Get info of a specific user
 * @access private
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId }).select(
      '-password'
    );
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route PUT api/users/:userId
 * @desc Update info of a specific user
 * @access private
 */
router.put(
  '/:userId',
  [
    check('name', 'Name is required').notEmpty(),
    check('phone', 'Phone number is required').isMobilePhone('en-IN'),
  ],
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { name, phone } = req.body;

      const user = await User.findOne({ id: req.params.userId }).select(
        '-password'
      );

      user.name = name;
      user.phone = phone;
      user.save();
      res.json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @route DELETE api/users
 * @desc delete users by ids
 * @access private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const { ids } = req.body;

    const { deletedCount } = await User.deleteMany({ _id: { $in: ids } });

    res.json({ msg: `Deleted ${deletedCount} users` });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
