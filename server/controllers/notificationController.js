import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get all notifications for user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        success: true,
        count: notifications.length,
        data: notifications
    });
});

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    res.json({
        success: true,
        data: notification
    });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { $set: { isRead: true } }
    );

    res.json({
        success: true,
        message: 'All notifications marked as read'
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    await notification.deleteOne();

    res.json({
        success: true,
        message: 'Notification removed'
    });
});
