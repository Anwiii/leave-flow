const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const { protect, restrictTo } = require('../middleware/auth');

// All leave routes require authentication
router.use(protect);

// ─────────────────────────────────────────────
//  EMPLOYEE ROUTES
// ─────────────────────────────────────────────

// @route   POST /api/leaves
// @desc    Employee applies for leave
// @access  Employee only
router.post(
  '/',
  restrictTo('employee'),
  [
    body('leaveType')
      .isIn(['sick', 'casual', 'earned', 'maternity', 'paternity', 'other'])
      .withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Invalid start date').toDate(),
    body('endDate').isISO8601().withMessage('Invalid end date').toDate(),
    body('reason')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Reason must be at least 10 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    try {
      // Ensure start date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(startDate) < today) {
        return res.status(400).json({ success: false, message: 'Start date cannot be in the past.' });
      }

      // Ensure end date >= start date
      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
      }

      // Check for overlapping leaves
      const overlap = await Leave.findOne({
        employee: req.user._id,
        status: { $ne: 'rejected' },
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          message: 'You already have a leave request that overlaps with these dates.',
        });
      }

      const leave = await Leave.create({
        employee: req.user._id,
        leaveType,
        startDate,
        endDate,
        reason,
      });

      res.status(201).json({ success: true, message: 'Leave application submitted.', leave });
    } catch (error) {
      console.error('Apply leave error:', error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

// @route   GET /api/leaves/my
// @desc    Employee views their own leaves
// @access  Employee only
router.get('/my', restrictTo('employee'), async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    console.error('Fetch my leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─────────────────────────────────────────────
//  EMPLOYER ROUTES
// ─────────────────────────────────────────────

// @route   GET /api/leaves
// @desc    Employer views all leave requests
// @access  Employer only
router.get('/', restrictTo('employer'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate('employee', 'name email department')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Leave.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      leaves,
    });
  } catch (error) {
    console.error('Fetch all leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   PATCH /api/leaves/:id/review
// @desc    Employer approves or rejects a leave
// @access  Employer only
router.patch(
  '/:id/review',
  restrictTo('employer'),
  [
    param('id').isMongoId().withMessage('Invalid leave ID'),
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const leave = await Leave.findById(req.params.id).populate('employee', 'name email');
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      if (leave.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot update a leave that is already ${leave.status}.`,
        });
      }

      leave.status = req.body.status;
      leave.reviewedBy = req.user._id;
      leave.reviewNote = req.body.reviewNote || '';
      await leave.save();

      await leave.populate('reviewedBy', 'name email');

      res.json({ success: true, message: `Leave ${req.body.status} successfully.`, leave });
    } catch (error) {
      console.error('Review leave error:', error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

// @route   GET /api/leaves/stats
// @desc    Employer gets leave statistics
// @access  Employer only
router.get('/stats', restrictTo('employer'), async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      Leave.countDocuments(),
    ]);

    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
