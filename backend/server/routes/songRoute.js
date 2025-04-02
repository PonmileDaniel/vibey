import express from "express";
import multer from "multer";
import { uploadTrack } from "../controllers/songController.js";
import {upload} from "../multer/multer.js";
import userAuth from "../middleware/userAuth.js";


const songRoute = express.Router();

songRoute.post('/upload', userAuth, upload.fields([ { name: 'audio' }, { name: 'image'}]), uploadTrack);

export default songRoute;