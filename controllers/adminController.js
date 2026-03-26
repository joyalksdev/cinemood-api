const User = require("../models/user");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");
const logActivity = require("../utils/logger");

// --- USER MANAGEMENT ---

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
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
    if (!user) return res.status(404).json({ message: "User signature not found" });

    // Safety: Prevent self-demotion
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

    // Auto-suspend logic: triggers if thresholds are met
    if (user.warnings >= 3 && user.status === "active") {
      user.status = "suspended";
    }
    await user.save();

    logActivity(
      req.user._id,
      `Admin: Issued warning to ${user.email} (Total: ${user.warnings})`,
      "admin",
    );

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
      .json({ success: true, message: `User ${user.name} neutralized` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- REVIEW MODERATION ---

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("userId", "email avatar status")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Neural stream interrupted" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    logActivity(
      req.user._id,
      `Admin: Deleted a flagged review (ID: ${req.params.id})`,
      "admin",
    );

    res.status(200).json({ success: true, message: "Review purged" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SYSTEM BROADCASTS ---


exports.getDashboardData = async (req, res) => {
  try {
    // 1. Get stats for your 4 cards
    const totalUsers = await User.countDocuments();

    // Active in last 24 hours
    const activeToday = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const threatLevel = await User.countDocuments({ warnings: { $gte: 2 } });

    // AI Requests today
    const aiRequests = await Activity.countDocuments({
      type: "search",
      timestamp: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    // 2. Get the latest 10 logs
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("user", "name email");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartDataRaw = await Activity.find({
      type: "search",
      timestamp: { $gte: sevenDaysAgo },
    }).select("timestamp");

    res.status(200).json({
      stats: { totalUsers, activeToday, threatLevel, aiRequests },
      activities: activities, // your 10 latest logs
      chartDataRaw // the raw timestamps for the graph
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

// --- SYSTEM BROADCASTS & NOTIFICATIONS ---

// 1. Get all notifications for the Admin Drawer
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50); // Keep the drawer performant
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch neural stream" });
  }
};

// 2. Create / Schedule a Notification
exports.createNotification = async (req, res) => {
  const { recipient, title, message, type, scheduledAt } = req.body;
  try {
    // 1. Clean the recipient ID
    // If it's a string like "null", an empty string, or undefined, set to null
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
    res.status(500).json({ success: false, message: "Signal broadcast failed" });
  }
};


// 3. Inline Update (From Admin Drawer)
exports.updateNotification = async (req, res) => {
  const { title, message } = req.body;
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, message },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Signal not found" });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

// 4. Delete Notification (Purge)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Signal already purged" });

    logActivity(
      req.user._id,
      `Admin: Purged notification ${req.params.id}`,
      "admin"
    );

    res.status(200).json({ success: true, message: "Notification purged from system" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Purge operation failed" });
  }
};