import express from "express";
import { uploadTrack,  uploadAlbum, getAllAlbums, getAllTracks, getIndiviualAlbums, getIndiviualTracks} from "../controllers/songController.js";
import {upload} from "../multer/multer.js";
import userAuth from "../middleware/userAuth.js";


const songRoute = express.Router();

songRoute.post('/upload', userAuth, upload.fields([ { name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1}]), uploadTrack);
songRoute.post('/upload-album', userAuth, upload.fields([
    { name: "tracks", maxCount: 12 },
    { name: 'image', maxCount: 1 },
]),
uploadAlbum
)

songRoute.get('/get-artist-album', userAuth, getIndiviualAlbums);
songRoute.get('/get-artist-track', userAuth, getIndiviualTracks)

songRoute.get('/get-tracks', userAuth, getAllTracks);
songRoute.get('/get-albums', userAuth, getAllAlbums);


export default songRoute;