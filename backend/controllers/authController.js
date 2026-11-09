
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";
import Salon from "../models/salonModel.js";

// ========================================
// HELPER: GENERATE JWT TOKEN
// ========================================
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ========================================
// NORMAL CUSTOMER REGISTRATION
// ========================================
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !confirmPassword ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Always create a customer account.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      role: "customer",
    });

    return res.status(201).json({
      success: true,
      message: "Customer registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// CUSTOMER LOGIN ONLY
// ========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // IMPORTANT: Admin cannot log in through customer login.
    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot use customer login. Please use admin login.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Customer login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Customer login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// ADMIN LOGIN ONLY
// ========================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await User.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    // IMPORTANT: Customer cannot log in through admin login.
    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Customer accounts cannot use admin login",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    const token = generateToken(admin);

    // Find salon belonging to admin.
    const salon = await Salon.findOne({
      ownerId: admin._id,
    }).select("_id");

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        salonId: salon?._id || null,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
};

// ========================================
// ADMIN REGISTRATION
// ========================================
export const registerAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      invitationCode,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password ||
      !confirmPassword ||
      !invitationCode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including phone number are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!/^[+]?[0-9\s()-]{7,20}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    // Validate invitation code.
    const expectedCode = process.env.ADMIN_REGISTRATION_CODE;

    if (
      !expectedCode ||
      invitationCode.trim() !== expectedCode.trim()
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin invitation code",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin account.
    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Salon owner registered successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        salonId: null,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Admin registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register salon owner",
    });
  }
};
