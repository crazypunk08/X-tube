import { Router } from "express"; //Here we are Extracting the Components from Express
import { registeredUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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

export default router