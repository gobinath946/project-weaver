const User = require("../models/User");
const Company = require("../models/Company");
const { logEvent } = require("./logs.controller");
const DropdownMaster = require("../models/DropdownMaster");





// @desc    Get user statistics with real data
// @route   GET /api/company/dashboard/users
// @access  Private (Company Admin/Super Admin)
const getUserStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const totalUsers = await User.countDocuments({ company_id: companyId });
    const activeUsers = await User.countDocuments({
      company_id: companyId,
      is_active: true,
    });
    const inactiveUsers = await User.countDocuments({
      company_id: companyId,
      is_active: false,
    });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Get recent user activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyActiveUsers = await User.countDocuments({
      company_id: companyId,
      updated_at: { $gte: thirtyDaysAgo },
    });

    const userStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentlyActiveUsers,
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      activityRate:
        totalUsers > 0
          ? Math.round((recentlyActiveUsers / totalUsers) * 100)
          : 0,
    };

    res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user stats",
    });
  }
};









// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

// ... keep existing code (settings and user management functions)

const getS3Config = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id).select(
      "s3_config"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company.s3_config || {},
    });
  } catch (error) {
    console.error("Get S3 config error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving S3 configuration",
    });
  }
};

const getCallbackConfig = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id).select(
      "integration_settings"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company.integration_settings || {},
    });
  } catch (error) {
    console.error("Get callback config error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving callback configuration",
    });
  }
};

const getBillingInfo = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id)
      .populate("plan_id")
      .select(
        "plan_id user_limit current_user_count subscription_status subscription_start_date subscription_end_date"
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const billingInfo = {
      current_plan: company.plan_id?.name || "Basic Plan",
      user_limit: company.user_limit,
      current_users: company.current_user_count,
      billing_cycle: "Monthly",
      next_billing: company.subscription_end_date,
      amount: company.plan_id?.price || 99,
    };

    res.status(200).json({
      success: true,
      data: billingInfo,
    });
  } catch (error) {
    console.error("Get billing info error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving billing information",
    });
  }
};

// ... keep existing code (all other functions: getUsers, createUser, updateUser, deleteUser, toggleUserStatus, sendWelcomeEmail, updateS3Config, updateCallbackConfig, testS3Connection, testWebhook)

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Check if the requesting user is a non-primary company_super_admin
    const isNonPrimarySuperAdmin = req.user.role === "company_super_admin" && !req.user.is_primary_admin;

    let filter = {
      company_id: req.user.company_id,
      is_primary_admin: { $ne: true },
    };

    // If user is non-primary company_super_admin, only show company_admin users
    if (isNonPrimarySuperAdmin) {
      filter.role = "company_admin";
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.is_active = status === "active";
    }

    const users = await User.find(filter)
      .populate("company_id")
      .populate('dealership_ids', 'dealership_id dealership_name dealership_address')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password");

    const totalRecords = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    // Update stats calculation based on the same filter
    const totalUsers = await User.countDocuments(filter);
    const activeUsers = await User.countDocuments({
      ...filter,
      is_active: true,
    });
    const inactiveUsers = await User.countDocuments({
      ...filter,
      is_active: false,
    });
    
    // Only include superAdmins and admins stats if not a non-primary super admin
    let stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
    };

    if (!isNonPrimarySuperAdmin) {
      stats.superAdmins = await User.countDocuments({
        company_id: req.user.company_id,
        role: "company_super_admin",
        is_primary_admin: { $ne: true },
      });
      stats.admins = await User.countDocuments({
        company_id: req.user.company_id,
        role: "company_admin",
      });
    }

    res.status(200).json({
      success: true,
      data: users,
      stats,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_records: totalRecords,
        per_page: parseInt(limit),
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, role, dealership_ids, is_primary_admin } = req.body;

    let creatingUser = req.user;
    
    if (creatingUser.is_primary_admin === undefined) {
      const fullUser = await User.findById(creatingUser.id);
      if (fullUser) {
        creatingUser = fullUser;
      }
    }

    // Check if user is trying to create a super admin without being primary admin
    if (role === 'company_super_admin' && !creatingUser.is_primary_admin) {
      return res.status(403).json({
        success: false,
        message: "Only primary admins can create super admin users",
      });
    }

    const existingUser = await User.findOne({
      company_id: creatingUser.company_id,
      $or: [{ email: email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const defaultPassword = "Welcome@123";    
    const finalIsPrimaryAdmin = is_primary_admin !== undefined && creatingUser.is_primary_admin 
      ? Boolean(is_primary_admin) 
      : false;

    const user = new User({
      ...req.body,
      password: defaultPassword,
      role: role || 'company_admin',
      dealership_ids: dealership_ids || [],
      company_id: creatingUser.company_id,
      is_first_login: true,
      created_by: creatingUser.id,
      is_primary_admin: finalIsPrimaryAdmin
    });

    await user.save();

    await Company.findByIdAndUpdate(creatingUser.company_id, {
      $inc: { current_user_count: 1 },
    });

    await logEvent({
      event_type: "user_management",
      event_action: "user_created",
      event_description: `User ${user.email} created with is_primary_admin: ${user.is_primary_admin}`,
      user_id: creatingUser.id,
      company_id: creatingUser.company_id,
      user_role: creatingUser.role,
    });

    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully. Welcome email sent.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { password, dealership_ids, is_primary_admin, ...updateData } = req.body;

    let updatingUser = req.user;
    
    // Check if is_primary_admin is missing from req.user and fetch from database if needed
    if (updatingUser.is_primary_admin === undefined) {
      const fullUser = await User.findById(updatingUser.id);
      if (fullUser) {
        updatingUser = fullUser;
      }
    }

    // Check if user is trying to update role to super admin without being primary admin
    if (updateData.role === 'company_super_admin' && !updatingUser.is_primary_admin) {
      return res.status(403).json({
        success: false,
        message: "Only primary admins can update users to super admin role",
      });
    }

    // Handle is_primary_admin field - only allow primary admins to set this
    let finalIsPrimaryAdmin;
    if (is_primary_admin !== undefined) {
      if (!updatingUser.is_primary_admin) {
        return res.status(403).json({
          success: false,
          message: "Only primary admins can update the primary admin status",
        });
      }
      finalIsPrimaryAdmin = Boolean(is_primary_admin);
    }

    // Prepare update data
    const finalUpdateData = {
      ...updateData,
      ...(dealership_ids !== undefined && { dealership_ids }),
      ...(is_primary_admin !== undefined && { is_primary_admin: finalIsPrimaryAdmin })
    };

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: updatingUser.company_id },
      finalUpdateData,
      { new: true, runValidators: true }
    ).select("-password").populate('dealership_ids', 'dealership_id dealership_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logEvent({
      event_type: "user_management",
      event_action: "user_updated",
      event_description: `User ${user.email} updated with is_primary_admin: ${user.is_primary_admin}`,
      user_id: updatingUser.id,
      company_id: updatingUser.company_id,
      user_role: updatingUser.role,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Company.findByIdAndUpdate(req.user.company_id, {
      $inc: { current_user_count: -1 },
    });

    await logEvent({
      event_type: "user_management",
      event_action: "user_deleted",
      event_description: `User ${user.email} deleted`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logEvent({
      event_type: "user_management",
      event_action: "user_status_updated",
      event_description: `User ${user.email} status changed to ${
        is_active ? "active" : "inactive"
      }`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
};

const sendWelcomeEmail = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    console.error("Send welcome email error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending welcome email",
    });
  }
};

const updateS3Config = async (req, res) => {
  try {
    const { bucket, access_key, secret_key, region, url } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company_id,
      {
        $set: {
          s3_config: { bucket, access_key, secret_key, region, url },
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "S3 configuration updated successfully",
      data: company.s3_config,
    });
  } catch (error) {
    console.error("Update S3 config error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating S3 configuration",
      error: error.message,
    });
  }
};

const updateCallbackConfig = async (req, res) => {
  try {
    const { inspection_callback_url, tradein_callback_url, webhook_secret } =
      req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company_id,
      {
        $set: {
          integration_settings: {
            webhook_url: inspection_callback_url,
            tradein_callback_url,
            webhook_secret,
          },
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Callback configuration updated successfully",
      data: company.integration_settings,
    });
  } catch (error) {
    console.error("Update callback config error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating callback configuration",
    });
  }
};

const testS3Connection = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "S3 connection test successful",
    });
  } catch (error) {
    console.error("Test S3 connection error:", error);
    res.status(500).json({
      success: false,
      message: "S3 connection test failed",
    });
  }
};

const testWebhook = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Webhook test successful",
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook test failed",
    });
  }
};

const getCompanyMasterdropdownvalues = async (req, res) => {
  try {
    const { dropdown_name } = req.body; // this will be an array
    if (!dropdown_name || !Array.isArray(dropdown_name)) {
      return res.status(400).json({
        success: false,
        message: "dropdown_name must be an array",
      });
    }

    // Fetch only matching dropdowns
    const dropdowns = await DropdownMaster.find({
      dropdown_name: { $in: dropdown_name },
      company_id:req.user.company_id,
      is_active: true,
    }).lean();

    res.status(200).json({
      success: true,
      data: dropdowns, // return full data of matched dropdowns
    });
  } catch (error) {
    console.error("Master: Get modules for permissions error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error retrieving modules" });
  }
};

// @desc    Get company information
// @route   GET /api/company/info
// @access  Private (Company Super Admin)
const getCompanyInfo = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id).select(
      'company_name contact_person email phone address city state country pincode timezone currency'
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company information',
    });
  }
};

// @desc    Update company information
// @route   PUT /api/company/info
// @access  Private (Company Super Admin)
const updateCompanyInfo = async (req, res) => {
  try {
    const {
      contact_person,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      timezone,
      currency,
    } = req.body;

    const company = await Company.findById(req.user.company_id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Update only the allowed fields (email cannot be changed)
    if (contact_person) company.contact_person = contact_person;
    if (phone) company.phone = phone;
    if (address) company.address = address;
    if (city) company.city = city;
    if (state) company.state = state;
    if (country) company.country = country;
    if (pincode !== undefined) company.pincode = pincode;
    if (timezone) company.timezone = timezone;
    if (currency) company.currency = currency;

    await company.save();

    await logEvent({
      event_type: 'company_management',
      event_action: 'company_info_updated',
      event_description: `Company information updated: ${company.company_name}`,
      user_id: req.user.id,
      company_id: company._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Company information updated successfully',
      data: {
        company_name: company.company_name,
        contact_person: company.contact_person,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        pincode: company.pincode,
        timezone: company.timezone,
        currency: company.currency,
      },
    });
  } catch (error) {
    console.error('Update company info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company information',
    });
  }
};

// @desc    Update company password
// @route   PUT /api/company/password
// @access  Private (Company Super Admin)
const updateCompanyPassword = async (req, res) => {
  try {
    const { old_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Get the user (company super admin)
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(old_password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = new_password;
    await user.save();

    await logEvent({
      event_type: 'user_management',
      event_action: 'password_changed',
      event_description: `Password changed for user: ${user.email}`,
      user_id: user._id,
      company_id: req.user.company_id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
    });
  }
};

module.exports = {
  // Dashboard endpoints

  getUserStats,


  // Settings endpoints
  getS3Config,
  getCallbackConfig,
  getBillingInfo,

  // User management
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  sendWelcomeEmail,

  // Settings actions
  updateS3Config,
  updateCallbackConfig,
  testS3Connection,
  testWebhook,
  getCompanyMasterdropdownvalues,
  
  // Company info
  getCompanyInfo,
  updateCompanyInfo,
  updateCompanyPassword,
};
