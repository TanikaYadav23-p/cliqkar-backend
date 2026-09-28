
const crypto = require('crypto');

const VisaApplication = require(
  '../../models/admin/VisaApplication'
);

const fileUrl = (req, file) => {
  return `${req.protocol}://${req.get('host')}/${String(
    file.path || `uploads/${file.filename}`
  )
    .replace(/\\/g, '/')
    .replace(/^.*?(uploads\/)/, 'uploads/')}`;
};

// ==========================================
// CREATE VISA APPLICATION
// ==========================================

exports.createVisaApplication = async (req, res) => {
  try {
    let payload;

    try {
      payload = JSON.parse(req.body.application || '{}');
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid application data.'
      });
    }

    if (
      !Array.isArray(payload.travelers) ||
      payload.travelers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one traveler is required.'
      });
    }

    const travelers = payload.travelers.map(traveler => ({
      ...traveler,
      files: {}
    }));

    (req.files || []).forEach(file => {
      const match = file.fieldname.match(
        /^traveler_(\d+)_(.+)$/
      );

      if (!match) return;

      const index = Number(match[1]);

      if (!travelers[index]) return;

      travelers[index].files[match[2]] = {
        originalName: file.originalname,
        fileName: file.filename,
        url: fileUrl(req, file)
      };
    });

    const role = req.user.role === 'agent'
      ? 'agent'
      : 'user';

    const referenceNumber =
      `VISA-${Date.now()}-${crypto.randomInt(100, 999)}`;

    const application = await VisaApplication.create({
      referenceNumber,

      applicant: {
        id: req.user.id,
        role,
        name: payload.applicant?.name || '',
        email: payload.applicant?.email || '',
        phone: payload.applicant?.phone || ''
      },

      visa: payload.visa || {},
      origin: payload.origin || '',
      destination: payload.destination || '',
      travelDate: payload.travelDate || '',
      returnDate: payload.returnDate || '',
      travelers,

      insurance: Boolean(payload.insurance),
      amount: Number(payload.amount) || 0,

      paymentStatus: 'Pending',
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Visa application submitted successfully.',
      application
    });

  } catch (error) {
    console.error('createVisaApplication:', error);

    res.status(500).json({
      success: false,
      message: error.message ||
        'Unable to submit visa application.'
    });
  }
};

// ==========================================
// GET MY APPLICATIONS
// ==========================================

exports.getMyVisaApplications = async (req, res) => {
  try {
    const applications = await VisaApplication.find({
      'applicant.id': req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ADMIN: GET ALL APPLICATIONS
// ==========================================

exports.getVisaApplications = async (req, res) => {
  try {
    const applications = await VisaApplication.find()
      .sort({ createdAt: -1 });

    const stats = {
      total: applications.length,

      pending: applications.filter(
        x => x.status === 'Pending'
      ).length,

      inProcess: applications.filter(
        x => x.status === 'In Process'
      ).length,

      approved: applications.filter(
        x => x.status === 'Approved'
      ).length,

      rejected: applications.filter(
        x => x.status === 'Rejected'
      ).length
    };

    res.json({
      success: true,
      applications,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// ADMIN: UPDATE APPLICATION
// ==========================================

exports.updateVisaApplication = async (req, res) => {
  try {
    const allowed = [
      'Pending',
      'In Process',
      'Approved',
      'Rejected',
      'On Hold'
    ];

    const update = {};

    if (
      req.body.status &&
      allowed.includes(req.body.status)
    ) {
      update.status = req.body.status;
    }

    if (typeof req.body.adminNote === 'string') {
      update.adminNote = req.body.adminNote;
    }

    if (
      req.body.paymentStatus &&
      ['Pending', 'Paid', 'Failed'].includes(
        req.body.paymentStatus
      )
    ) {
      update.paymentStatus = req.body.paymentStatus;
    }

    const application =
      await VisaApplication.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true, runValidators: true }
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    res.json({
      success: true,
      application
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};