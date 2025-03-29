// import mongoose from "mongoose";


// const connectDB = async () => {
//     mongoose.connection.on('connected', () => console.log('DataBase Connected'))
//     await mongoose.connect(`${process.env.MONGODB_URI}/mern`);
// }
// export default connectDB;

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
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
