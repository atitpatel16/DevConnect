import mongoose from "mongoose";

const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDb connected");
    } catch (error){
     console.error("Unable to connect :" , error);

    }
}

export default connectDB;