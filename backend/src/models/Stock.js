const mongoose = require('mongoose')

const StockSchema = new mongoose.Schema({
  startingStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Stock', StockSchema)
