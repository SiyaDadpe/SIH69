/**
 * Models Index
 * 
 * Central export point for all Mongoose models.
 * Import models from this file for consistency.
 * 
 * @module models
 * 
 * @example
 * const { User, Project, Insight } = require('./models');
 */

const User = require('./User');
const Project = require('./Project');
const Insight = require('./Insight');
const Benchmark = require('./Benchmark');
const SystemStatus = require('./SystemStatus');
const Operation = require('./Operation');
const CanvasWorkflow = require('./CanvasWorkflow');

module.exports = {
  User,
  Project,
  Insight,
  Benchmark,
  SystemStatus,
  Operation,
  CanvasWorkflow
};
