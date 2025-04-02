import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from "./server/config/mongobd.js";
import 'dotenv/config'
import authRouter from "./server/routes/authroute.js";
import songRoute from "./server/routes/songRoute.js";

const app = express();

connectDB();
const PORT = process.env.PORT || 5000;



app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true}))

//Api Endpoint
app.get('/', (req,res) => {
    console.log(req)
    return res.status(234).send('Welcome')
})

app.use('/api/auth', authRouter)
app.use('/api/song', songRoute)

app.listen(PORT, () => {
    console.log(`Port running at ${PORT} `)
})