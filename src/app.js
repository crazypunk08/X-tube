import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //To handle crud operations on cookies of clients browser
const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

 app.use(express.json({limit:"20kb"}))  //This enables to handle  JSON related request 
 app.use(express.urlencoded({extended:true}));
 app.use(express.static("public"));
 app.use(cookieParser());
export default app;