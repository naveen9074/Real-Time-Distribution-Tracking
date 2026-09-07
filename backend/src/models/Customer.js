const mongoose = require('mongoose');

/**
 * Customer / store that buys from the delivery van.
 * Seeded with 10 sample stores.
 */
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    assignedVehicleId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
