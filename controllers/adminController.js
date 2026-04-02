const User = require("../models/user");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");
const logActivity = require("../utils/logger");

// --- USER MANAGEMENT ---

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // security: exclude hashes so they never reach the frontend
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // safety: prevents an admin from accidentally removing their own privileges
    if (req.user._id.toString() === user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "Cannot revoke your own Admin status" });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logActivity(
      req.user._id,
      `Admin: Changed ${user.email} from ${oldRole} to ${role}`,
      "admin"
    );

    res.status(200).json({ 
      success: true, 
      message: `Access level set to ${role.toUpperCase()}`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Role override failed" });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: `Status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.warnUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.warnings += 1;

    // escalation logic: hitting the 3-warning threshold triggers an automatic suspension
    if (user.warnings >= 3 && user.status === "active") {
      user.status = "suspended";
    }
    await user.save();

    logActivity(
      req.user._id,
      `Admin: Issued warning to ${user.email} (Total: ${user.warnings})`,
      "admin",
    );

    // creates an in-app alert for the specific user being warned
    await Notification.create({
      sender: req.user._id,
      recipient: user._id,
      title: "⚠️ Policy Violation Warning",
      message: `Formal warning issued. Count: ${user.warnings}/3. Review community guidelines.`,
      type: "warning",
    });

    res.status(200).json({ success: true, warnings: user.warnings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Operation failed" });
  }
};

exports.clearWarnings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.warnings = 0;
    // auto-reverses suspension if the user was suspended purely for warning counts
    if (user.status === "suspended") user.status = "active";
    await user.save();

    await Notification.create({
      sender: req.user._id,
      recipient: user._id,
      title: "✅ Warnings Cleared",
      message:
        "Your warning count has been reset. Account is back in good standing.",
      type: "system",
    });

    logActivity(
      req.user._id,
      `Admin: Cleared all warnings for ${user.email}`,
      "admin",
    );

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Reset failed" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "banned";
    await user.save();

    logActivity(
      req.user._id,
      `Admin: Banned user ${user.email} permanently`,
      "admin",
    );

    res
      .status(200)
      .json({ success: true, message: `User ${user.name} banned` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- REVIEW MODERATION ---

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("userId", "email avatar status") // join user data so admins see who wrote what
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("userId", "email");
    if (!review) return res.status(404).json({ message: "Review not found" });

    await Review.findByIdAndDelete(req.params.id);
    
    logActivity(
      req.user._id,
      `Admin Deleted: Review by ${review.userId?.email || review.userName}`,
      "admin"
    );

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SYSTEM BROADCASTS ---

exports.getDashboardData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // snapshot of users active within the rolling 24-hour window
    const activeToday = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // identifies "at-risk" users who are one warning away from suspension
    const threatLevel = await User.countDocuments({ warnings: { $gte: 2 } });

    // tracks usage volume specifically for the search/ai features today
    const aiRequests = await Activity.countDocuments({
      type: "ai",
      timestamp: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    // fetches recent logs to show a "live feed" of system activity
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("user", "name email");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // collects raw data points for the frontend to render the activity trend chart
    const chartDataRaw = await Activity.find({
      type: "search",
      timestamp: { $gte: sevenDaysAgo },
    }).select("timestamp");

    res.status(200).json({
      stats: { totalUsers, activeToday, threatLevel, aiRequests },
      activities: activities, 
      chartDataRaw 
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

// --- SYSTEM BROADCASTS & NOTIFICATIONS ---

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50); // capping the results ensures the admin drawer loads quickly
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

exports.createNotification = async (req, res) => {
  const { recipient, title, message, type, scheduledAt } = req.body;
  try {
    // null recipient logic: if no ID is provided, the system treats it as a "Global" message for everyone
    const finalRecipient = (recipient && recipient.toString().trim() !== "" && recipient !== "null") 
      ? recipient 
      : null;

    const notification = await Notification.create({
      sender: req.user._id,
      recipient: finalRecipient, 
      title,
      message,
      type,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    logActivity(
      req.user._id, 
      `Admin: ${finalRecipient ? 'Individual' : 'Global'} Broadcast - ${title}`, 
      "admin"
    );

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Notification broadcast failed" });
  }
};

exports.updateNotification = async (req, res) => {
  const { title, message } = req.body;
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification already deleted" });

    logActivity(
      req.user._id,
      `Admin: Deleted notification ${req.params.id}`,
      "admin"
    );

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete operation failed" });
  }
};