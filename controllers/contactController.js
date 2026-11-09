
import nodemailer from "nodemailer";
import Contact from "../models/contactModel.js";

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ========================================
// 1. CUSTOMER SENDS CONTACT MESSAGE
// ========================================

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must contain at least 10 characters.",
      });
    }

    // Save message in MongoDB first
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send notification email
    let emailSent = false;

    try {
      await transporter.sendMail({
        from: `"StyleHub Contact" <${process.env.SMTP_USER}>`,
        to: process.env.SUPPORT_EMAIL,
        replyTo: email.trim(),
        subject: `New StyleHub Message: ${subject.trim()}`,

        text: `
New contact message received on StyleHub.

Name: ${name.trim()}
Email: ${email.trim()}
Subject: ${subject.trim()}

Message:
${message.trim()}

Message ID: ${contact._id}
        `,
      });

      emailSent = true;
    } catch (emailError) {
      // Message remains saved even if email fails
      console.error("Contact email error:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
      emailSent,
      contactId: contact._id,
    });
  } catch (error) {
    console.error("Send contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send your message. Please try again.",
    });
  }
};

// ========================================
// 2. ADMIN GETS ALL CONTACT MESSAGES
// ========================================

export const getContactMessages = async (req, res) => {
  try {
    const messages = await Contact.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Get contact messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch contact messages.",
    });
  }
};

// ========================================
// 3. ADMIN UPDATES MESSAGE STATUS
// ========================================

export const updateContactStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "replied"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message status.",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      messageId,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message status updated.",
      contact,
    });
  } catch (error) {
    console.error("Update contact status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update message status.",
    });
  }
};
