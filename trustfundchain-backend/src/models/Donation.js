const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Identity' },
  amount: { type: Number, required: true },
  message: { type: String },
}, { timestamps: true });
module.exports = mongoose.model('Donation', donationSchema);