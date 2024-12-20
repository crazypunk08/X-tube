import { Router } from "express"; //Here we are Extracting the Components from Express
import { registeredUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router(); //This will Catch the Url and fire the controller

router.route("/register").post( //Dont forget to add multer middleware
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registeredUser)

    router.route("/login").post(loginUser)
    router.route("/logout").post(verifyJWT,logoutUser)
    router.route("/refreshToken").post(refreshAccessToken)


export default router