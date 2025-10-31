import User from "../models/userModel.js";
import CustomAPIError from "../errors/customApiError.js";
import transporter from "../config/nodemailer.js";
import bcrypt from "bcryptjs";

const generateAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    return accessToken;
  } catch (error) {
    throw new CustomAPIError("Something went wrong", 500);
  }
};

export const userRegister = async (req, res) => {
  try {
    const { name, password, email } = req.body;
    if (!name || !password || !email) {
      throw new CustomAPIError(400, `Missing details`);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new CustomAPIError(409, `${req.body.name} already exists`);
    }

    const user = await User.create({
      name,
      password,
      email,
    });

    const token = await generateAccessToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `Welcome, ${name}`,
      text: `Your account has been created with email id: ${email}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "New user created",
      user: user,
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new CustomAPIError(400, `Please provide email and password`);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomAPIError(404, `User does not exist`);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new CustomAPIError(401, "Invalid password");
    }

    const token = await generateAccessToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: user,
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.status(200).json({
      success: true,
      message: "User logged out",
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (user.isAccountVerified) {
      throw new CustomAPIError(400, "Account already verified");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: `Account verification OTP`,
      text: `Your OTP is ${otp}, verify your account using this otp`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification OTP sent on Email",
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      throw new CustomAPIError(400, "Missing details");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new CustomAPIError(404, "User not found");
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      throw new CustomAPIError(400, "Invalid OTP");
    }

    if (user.verifyOtpExpiredAt < Date.now()) {
      throw new CustomAPIError(400, "OTP expired");
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpiredAt = 0;

    await user.save();
    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    // Handle custom errors
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomAPIError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomAPIError(404, "User not found");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpiredAt = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: `Password reset OTP`,
      text: `Your OTP for reseting your password is ${otp}. Use this OTP to proceed with resetting your password`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!otp || !email || !newPassword) {
      throw new CustomAPIError(400, "Please provide the details");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomAPIError(404, "User not found");
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      throw new CustomAPIError(400, "Invalid otp");
    }

    if (user.resetOtpExpiredAt < Date.now()) {
      throw new CustomAPIError(400, "OTP expired ");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpiredAt = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    if (error instanceof CustomAPIError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
