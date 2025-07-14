const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
  did: {
    type: String,
    required: true,
    unique: true
  },
  publicKey: {
    type: String,
    required: true
  },
  secretKey: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    default: 'ninguno'
  },
  documentNumber: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  verified: {
    type: Boolean,
    default: false
  },
  qrCode: String,
  profilePhoto: String,
  network: {
    type: String,
    default: 'local'
  },
  isRealStellar: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Identity', identitySchema);
