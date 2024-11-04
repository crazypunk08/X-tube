import mongoose from "mongoose";
import{DB_NAME} from "../constants.js";

const connectDB=async()=>{
    try{
       const connectioninstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
       console.log(connectioninstance.connection.host);
    } catch(e){
        console.log("mongodb connection error",e);
        process.exit(1);
    }
}

export default connectDB;