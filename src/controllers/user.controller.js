import {asyncHandler} from "../utils/asyncHandler.js"; //Wrappper to handle asynchronous functions
import {ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js"; //User has access to database
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
 
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
   const existeduser=User.findOne({
    $or:[{username},{email}]
   })
   if(existeduser){
    throw new ApiError(400,"user already exist");
   }
   //check for images ,check for avatar
   const avatarLocalPath=req.files?.avatar[0]?.path;
   const coverImageLocal=req.files?.coverImage[0]?.path;
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

export {registeredUser}