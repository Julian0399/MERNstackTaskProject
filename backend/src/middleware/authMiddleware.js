import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../models/auth/UserModel.js'

export const protect = asyncHandler(async (req, res, next) => {
    try {
        
        const token = req.cookies.token
        
        if (!token) {
          res.status(401).json({ message: "Not authorized, token failed" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        //check if user exists
        if (!user) {
          res.status(404).json({ message: "User not found" });
        }

        //set user details in req.user
        req.user = user;
        next()
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
})

// admin middleware
export const adminMiddleware = asyncHandler(async (req, res, next) => {
  if(req.user && req.user.role === "admin"){
    next()
    return
  }
    res.status(403).json({message: "Only admins can delete users"})
})

// create middleware

export const createMiddleware = asyncHandler(async (req, res, next) => {
  if((req.user && req.user.role === 'creator') || (req.user && req.user.role === 'admin')){
    next()
    return
  }
  res.status(403).json({message: "Only creators can get all users"})
})

// verified middleware
export const verifiedMiddleware = asyncHandler(async(req,res,next) => {
  if(req.user && req.user.isverified){
    next()
    return
  }
  res.status(403).json({message: "User not verified"})
})