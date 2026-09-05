const mongoose = require('mongoose');

/**
 * Represents the delivery van / vehicle with current stock.
 * Only one Vehicle document is expected per deployment (the active van).
 */
const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Van 001',
      trim: true,
    },
    /** Current number of boxes remaining in the van */
    stock: {
      type: Number,
      default: 50,
      min: [0, 'Stock cannot be negative'],
    },
    /** Selling price per box in INR */
    pricePerUnit: {
      type: Number,
      default: 60,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
