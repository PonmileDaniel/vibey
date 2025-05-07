import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from "./server/config/mongobd.js";
import 'dotenv/config'
import authRouter from "./server/routes/authroute.js";
import songRoute from "./server/routes/songRoute.js";
import listenerRouter from "./server/routes/listenerRoute.js";

const app = express();

connectDB();
const PORT = process.env.PORT || 5001;



app.use(express.json());
app.use(cookieParser());


// Configure CORS based on environment
if (process.env.NODE_ENV === 'production') {
    app.use(cors({
      origin: true, // Allow the server's origin
      credentials: true
    }));
} else {
    // In development, allow requests from frontend dev server
    app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true
    }));
}
  
// Parse JSON in request body
app.use(express.json());
  
// API Endpoints
app.get('/api', (req, res) => {
    return res.status(200).send('Welcome to API');
});
  
app.use('/api/auth', authRouter);
app.use('/api/song', songRoute);
app.use('/api/listener', listenerRouter);
  
// In production, serve frontend static files
if (process.env.NODE_ENV === 'production') {
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // For any route that doesn't match an API route, send the frontend app
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}
  
app.listen(PORT, () => {
    console.log(`Server running at ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// app.use(cors({
//     origin: 'http://localhost:5173',
//     credentials: true}))

// //Api Endpoint
// app.get('/', (req,res) => {
//     console.log(req)
//     return res.status(234).send('Welcome')
// })

// app.use('/api/auth', authRouter)
// app.use('/api/song', songRoute)
// app.use('/api/listener', listenerRouter)

// app.listen(PORT, () => {
//     console.log(`Port running at ${PORT} `)
// })