/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and password management
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');


/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, organization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      organization
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('[INFO]', 'User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    });
  } catch (error) {
    console.error('[ERROR]', 'Registration error', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn('[WARN]', 'Failed login attempt', { email: user.email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('[INFO]', 'User logged in successfully', {
      userId: user._id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          lastLogin: user.lastLogin
        },
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    });
  } catch (error) {
    console.error('[ERROR]', 'Login error', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    console.log('[INFO]', 'Token refreshed successfully', { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    });
  } catch (error) {
    console.error('[ERROR]', 'Token refresh error', { error: error.message });
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('[ERROR]', 'Get profile error', { error: error.message });
    next(error);
  }
};

/**
 * Update user profile
 * PATCH /api/auth/me
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() })
      },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('[INFO]', 'Profile updated', { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('[ERROR]', 'Profile update error', { error: error.message });
    next(error);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user and explicitly select password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log('[INFO]', 'Password changed', { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('[ERROR]', 'Change password error', { error: error.message });
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    console.log('[INFO]', 'User logged out', { userId: req.user.userId });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('[ERROR]', 'Logout error', { error: error.message });
    next(error);
  }
};
