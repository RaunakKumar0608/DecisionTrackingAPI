import mongoose from "mongoose";
import "dotenv/config"

export async function ConnectDB()  {

try{
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected");
}catch(e){
    console.error(e);
    console.error("Error: MongoDB not connected");
    process.exit(1);
}

}

export default ConnectDB;