
const mongoose = require('mongoose');

const visaApplicationSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  applicant: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    role: {
      type: String,
      enum: ['user', 'agent'],
      default: 'user'
    },
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: '',
      lowercase: true
    },
    phone: {
      type: String,
      default: ''
    }
  },

  visa: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  origin: {
    type: String,
    default: ''
  },

  destination: {
    type: String,
    default: ''
  },

  travelDate: {
    type: String,
    default: ''
  },

  returnDate: {
    type: String,
    default: ''
  },

  travelers: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  insurance: {
    type: Boolean,
    default: false
  },

  amount: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },

  status: {
    type: String,
    enum: ['Pending', 'In Process', 'Approved', 'Rejected', 'On Hold'],
    default: 'Pending',
    index: true
  },

  adminNote: {
    type: String,
    default: ''
  }

}, {
  timestamps: true
});

visaApplicationSchema.index({ createdAt: -1 });
visaApplicationSchema.index({ 'applicant.email': 1 });

module.exports = mongoose.model(
  'VisaApplication',
  visaApplicationSchema
);