import asyncHandler from "express-async-handler";
import User from "../../models/auth/UserModel.js";
import generateToken from "../../helpers/generateToken.js";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Token from "../../models/auth/Token.js";
import crypto from "crypto";
import hashToken from "../../helpers/hashToken.js";
import sendEmail from "../../helpers/sendEmail.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  //validation

  if (!name || !email || !password) {
    //bad request
    res.status(400).json({ message: "Please provide all fields" });
  }
  //check password length
  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  //check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: "User already exists" });
  }
  //create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // generate token JWT

  const token = generateToken(user._id);
  // send response with token and user data

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    sameSite: "strict",
    secure: false,
  });

  if (user) {
    const { _id, name, email, role, photo, bio, isVerified } = user;

    //201: created
    res.status(201).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

//User login

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //validation

  if (!email || !password) {
    //bad request
    res.status(400).json({ message: "Please provide all fields" });
  }
  //
  
  const userExists = await User.findOne({ email });
  console.log(userExists);
  
  if (!userExists) {
    res.status(400).json({ message: "User not found, please sign up!" });
  }

  // verify password match
  console.log(password,userExists.password);
  
  const isMatch = await bycrypt.compare(password, userExists.password);
  console.log(isMatch);
  
  if (!isMatch) {
    res.status(400).json({ message: "Invalid credentials" });
  }

  const token = generateToken(userExists._id);

  if (userExists && isMatch) {
    const { _id, name, email, role, photo, bio, isVerified } = userExists;

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
      sameSite: "strict",
      secure: false,
    });

    //200: OK
    res.status(200).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  }
});

//logout user

export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
})

//get user profile

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});


//update user profile

export const updateUser = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user._id)

  if(user){
    const {name,bio,photo} = req.body

    user.name = req.body.name || user.name
    user.bio = req.body.bio || user.bio
    user.photo = req.body.photo || user.photo

    const updatedUser = await user.save()

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      photo: updatedUser.photo,
      bio: updatedUser.bio,
      isVerified: updatedUser.isVerified,
    })
  }else{
    res.status(404).json({message: "User not found"})
  }
})

//login status
export const userLoginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if(decoded){
    res.status(200).json({message: "User logged in"})
  }else {
    res.status(401).json({message: "User not logged in"})
  }
});

//verify email user
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if(!user){
    res.status(404).json({message: "User not found"})
  }
  if(user.isVerified){
    res.status(200).json({message: "Email is verified"})
  }
  let token = await Token.findOne({userId: user._id})

  if(token){
    await token.deleteOne()
  }

  const verificationToken = crypto.randomBytes(32).toString("hex") + user._id
  const hashedToken = await hashToken(verificationToken)

  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 *60 * 1000,
  }).save()

  //verification link
  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`
  //send email
  const subject = "Email verification - React Node Auth"
  const send_to = user.email
  const reply_to = process.env.SMTP_USER
  const template = "emailVerification"
  const send_from = process.env.USER_EMAIL
  const name = user.name
  const link = verificationLink


  try {
    await sendEmail(subject, send_to, reply_to, template, send_from, name, link)
    res.status(200).json({message: "Verification email sent"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Email could not be sent"})
  }
});

export const verifyUser = asyncHandler(async (req, res) => {
  const {verificationToken} = req.params
  if(!verificationToken){
    res.status(400).json({message: "Invalid verification token"})
  }
  const hashedToken = await hashToken(verificationToken)

  const userToken = await Token.findOne({verificationToken: hashedToken,
    expiresAt: { $gt: Date.now() }
  })
  if(!userToken){
    res.status(400).json({message: "Invalid or expired verification token"})
  }
  //find user by token
  const user = await User.findById(userToken.userId)
  if(user.isVerified){
    res.status(400).json({message: "Email is already verified"})
  }
  user.isVerified = true
  await user.save()
  res.status(200).json({message: "Email verified successfully"})
});

//forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
  const {email} = req.body
  if(!email){
    return res.status(400).json({message: "Please provide email"})
  }
  const user = await User.findOne({email})
  if(!user){
    return res.status(400).json({message: "User not found"})
  }
  let token = await Token.findOne({userId: user._id})

  if(token){
    await token.deleteOne()
  }
  const passwordResetToken = crypto.randomBytes(32).toString("hex") + user._id
  //hash token
  const hashedToken = await hashToken(passwordResetToken)

  await new Token({
    userId: user._id,
    passwordResetToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 *60 * 1000,
  }).save()
  //reset password link
  const resetPasswordLink = `${process.env.CLIENT_URL}/reset-password/${passwordResetToken}`
  //send email
  const subject = "Password reset - React Node Auth"
  const send_to = user.email
  const reply_to = process.env.SMTP_USER
  const template = "forgotPassword"
  const send_from = process.env.USER_EMAIL
  const name = user.name
  const link = resetPasswordLink

  try {
    await sendEmail(subject, send_to, reply_to, template, send_from, name, link)
    res.status(200).json({message: "Password reset email sent"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Email could not be sent"})
  }
});

//reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const {resetPasswordToken} = req.params
  const {password} = req.body
  console.log("Token en req.params:", req.params);
  if(!password){
    return res.status(400).json({message: "Please provide password"})
  }
  // hash 
  const hashedToken = await hashToken(resetPasswordToken)
  console.log("Hashed token:", hashedToken);
  
  const userToken = await Token.findOne({passwordResetToken: hashedToken,expiresAt: { $gt: Date.now() }})
  console.log("Tokens en DB:", await Token.find());
  if(!userToken){
    return res.status(400).json({message: "Invalid or expired reset password token"})
  }
  //find user by token
  const user = await User.findById(userToken.userId)
  user.password = password
  await user.save()
  res.status(200).json({message: "Password reset successfully"})
});

export const changePassword = asyncHandler(async (req, res) => {
  const {currentPassword, newPassword} = req.body
  if(!currentPassword || !newPassword){
    return res.status(400).json({message: "Please provide all fields"})
  }
  const user = await User.findById(req.user._id)
  if(!user){
    return res.status(400).json({message: "User not found"})
  }
  const isMatch = await bycrypt.compare(currentPassword, user.password)
  if(!isMatch){
    return res.status(400).json({message: "Invalid current password"})
  }
  if(isMatch){
    user.password = newPassword
    await user.save()
    return res.status(200).json({message: "Password changed successfully"})
  }
});