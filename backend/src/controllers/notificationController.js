const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' }
      });
    }

    // Check ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' }
      });
    }

    // Check ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' }
      });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};
