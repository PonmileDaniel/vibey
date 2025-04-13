import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "mern",
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(" Database Connected");
    } catch (error) {
        console.error(" Database Connection Error:", error);
    }
};

export default connectDB;
