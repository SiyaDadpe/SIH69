/**
 * User Model
 * 
 * Represents a user in the system with authentication credentials,
 * profile information, and subscription details.
 * 
 * @module models/User
 */

const mongoose = require('mongoose');

/**
 * User Schema
 * 
 * @typedef {Object} User
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique, lowercase)
 * @property {string} organization - User's organization name
 * @property {string} role - User's role in the system
 * @property {string} subscription - User's subscription tier
 * @property {string} password - Hashed password
 * @property {Object} preferences - User preferences and settings
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} lastLogin - Last login timestamp
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },

    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters']
    },

    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['engineer', 'manager', 'policymaker', 'researcher'],
        message: '{VALUE} is not a valid role'
      },
      default: 'engineer'
    },

    subscription: {
      type: String,
      required: [true, 'Subscription tier is required'],
      enum: {
        values: ['basic', 'pro', 'enterprise'],
        message: '{VALUE} is not a valid subscription tier'
      },
      default: 'basic'
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Don't include password in queries by default
    },

    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Indexes
 */

// Compound index on email for faster lookups
userSchema.index({ email: 1 });

// Index for filtering by role and subscription
userSchema.index({ role: 1, subscription: 1 });

// Index for organization lookups
userSchema.index({ organization: 1 });

/**
 * Virtual Properties
 */

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    name: this.name,
    email: this.email,
    organization: this.organization,
    role: this.role,
    subscription: this.subscription
  };
});

/**
 * Instance Methods
 */

/**
 * Update last login timestamp
 * @returns {Promise<User>}
 */
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * Check if user has pro or enterprise subscription
 * @returns {boolean}
 */
userSchema.methods.hasPremiumAccess = function() {
  return ['pro', 'enterprise'].includes(this.subscription);
};

/**
 * Pre-save middleware
 */

// Ensure email is lowercase before saving
userSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

/**
 * User Model
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
