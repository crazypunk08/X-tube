import {asyncHandler} from "../utils/asyncHandler.js"; //Wrappper to handle asynchronous functions
import {ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js"; //User has access to database
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from jsonwebtoken;

const generateAccessAndRefreshTokens=async(userId)=>{
   try{
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken();
      const refreshToken=user.generateRefreshToken();
      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
   }
   catch(error){
      throw new ApiError(500,"Something went wrong in generating access and refresh token")
   }
}
 //Register user
const registeredUser=asyncHandler(async(req,res)=>{
    //get user details from frontend 
   const {fullname,email,username,password}=req.body
   //validation not empty or not
   if(
    [fullname,email,username,password].some((field)=>field?.trim() ==="")
   ){
        throw new ApiError(400,"All fields are required")
   }
   //check if user already exists :username and password
   const existeduser= await User.findOne({
    $or:[{username},{email}]
   })
   if(existeduser){
    throw new ApiError(400,"user already exist");
   }
   //check for images ,check for avatar
   const avatarLocalPath=req.files?.avatar[0]?.path;
   //const coverImageLocal=req.files?.coverImage[0]?.path;

    let coverImageLocal;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocal=req.files.coverImage[0].path;
    }  

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
   }
   //upload to cloudinary 
   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=await uploadOnCloudinary(coverImageLocal);
   if(!avatar){
    throw new ApiError(400,"Avatar file is required");
   }
   //create user object to create entry in db
   const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })
   //remove password and refresh token field from response
   const createuser=await User.findById(user._id).select(
    "-password -refreshToken"
   )
     
   //check for user creation

   if(!createuser){
    throw new ApiError(500 ,"Something went wrong while registering the user in server")
   }
      //return response
   return res.status(201).json(
    new ApiResponse(200,createuser,"User registered successfully")
   )

})

//Login user
const loginUser=asyncHandler(async(req,res)=>{
   //req body -->data
   const{email,username,password}=req.body
   //username or email
   if(!(username || email)){
      throw new ApiError(400,"Username or email required")
   }
   //find the user
   const user=await User.findOne({
      $or:[{email},{username}]
   })
   if(!user){
      throw new ApiError(404,"User not found");
   }
   //password check
   const isvalidPassword=await user.isPasswordCorrect(password);
   if(!isvalidPassword){
      throw new ApiError(404,"Password Incorrect");
   }
   // generate access and refresh token
   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
   // send these tokens through cookies
   const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
   //Setting these options makes cookie modifyable only through server side
   const options={
      httpOnly:true,
      secure:true
   }
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(
         200,{
            user:loggedInUser,accessToken,refreshToken
         },
         "User logged in successfully"
      )
   )
   //response saying login sucessfull
})

//Logout user
const logoutUser=asyncHandler(async(req,res)=>{
   User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new:true
      }
   )
   const options={
      httpOnly:true,
      secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out"))
})

//End point to refresh access
const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorised access");
   }

  const decodedToken= jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
   )

   const user=await User.findById(decodedToken?._id);

   if (!user) {
      throw new ApiError(401,"invalid refresh token ie malicious token received")
   }

   if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401,"refresh token is expired or used");
   }

   const options={
      httpOnly:true,
      secure:true
   }
   const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id);

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newrefreshToken,options)
   .json(
      new ApiResponse(
         200,{
            accessToken,newrefreshToken
         },
         "Access token refreshed"
      )
   )
})

export {registeredUser,
         loginUser,
         logoutUser,
         refreshAccessToken
}