const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Order', OrderSchema)
