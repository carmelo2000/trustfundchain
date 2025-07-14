const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  stellarTxHash: String,
  beneficiary: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Education', 'Healthcare', 'Housing', 'Economic'],
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  location: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity'
  },
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Identity'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);