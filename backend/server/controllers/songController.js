import { getUploadUrl } from "../config/backblaze.js";
import Track from "../models/trackModel.js";
import Album from "../models/albumModel.js";
import dotenv from "dotenv";
import axios from "axios";
import { parseBuffer } from "music-metadata";

dotenv.config();

export const uploadTrack = async (req, res) => {
  try {
    /**
     * Get the title and description
     * Upload the first audio file present
     * If image exist then get the first file otherwise set imagefile to null
     * Get the file of the current authenticated user, which would be the artist eho uploaded the track
     */
    const { title, description } = req.body;
    const creator = req.user._id;

    // Validate audio file 
    if (!req.files || !req.files['audio'] || req.files['audio'].length === 0) {
      return res.status(400).json({ message: 'Audio file is required'})

    }

    // Validate image file
    if (!req.files || !req.files['image'] || req.files['image'].length === 0) {
      return res.status(400).json({ message: 'Image file is required'})

    }

    const audioFile = req.files['audio'][0];
    const imageFile = req.files['image'][0];
    //const imageFile = req.files['image'] ? req.files['image'][0] : null;
    
    // Get upload URL
    const { uploadUrl, authorizationToken } = await getUploadUrl(process.env.B2_BUCKET_ID);

    // Function to upload a file using Axios
    async function uploadFile(file, fileName) {
      const headers = {
        Authorization: authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": file.mimetype,
        "X-Bz-Content-Sha1": "do_not_verify",
      };

      const response = await axios.post(uploadUrl, file.buffer, { headers });

      return `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
    }

    /**
     * Timestamp to ensure uniqueness 
     * Upload file and imae file to B2 and gets their public URLS
     */

    const audioFileName = `songs/${Date.now()}_${audioFile.originalname}`;
    const imageFileName = imageFile ? `covers/${Date.now()}_${imageFile.originalname}` : null;

    const audioUrl = await uploadFile(audioFile, audioFileName);
    const imageUrl = imageFile ? await uploadFile(imageFile, imageFileName) : null;

    //  Extract audio metadata (duration)
    const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
    const durationInSeconds = Math.floor(metadata.format.duration || 0);
    const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, "0")}`;

    // Save this track into Mongodb 
    const newSong = new Track({
      trackName: title,
      description,
      audioUrl,
      imageUrl,
      artistId: creator,
      duration: formattedDuration
    });

    await newSong.save();
    res.status(201).json({ message: "Song uploaded successfully!", song: newSong });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};






export const uploadAlbum = async (req, res) => {
  try {
    const { albumName, description, trackTitles } = req.body;
    const audioFiles = req.files["tracks"]; // An array of tracks
    const imageFile = req.files['image'][0];
    const creator = req.user._id;
    const parsedTitles = JSON.parse(trackTitles);

    if (!audioFiles || audioFiles.length === 0) {
      return res.status(400).json({ message: "No tracks provided" });
    }

    if (!req.files || !req.files['image'] || req.files['image'].length === 0)
      return res.status(400).json({ message: 'Image file is required' });

    // Function to upload files to Backblaze
    async function uploadFile(file, fileName) {
      try {
        // Get a new upload URL and auth token for each file upload
        const { uploadUrl, authorizationToken } = await getUploadUrl(process.env.B2_BUCKET_ID);

        const headers = {
          Authorization: authorizationToken, // Use the current auth token
          "X-Bz-File-Name": encodeURIComponent(fileName),
          "Content-Type": file.mimetype,
          "X-Bz-Content-Sha1": "do_not_verify",
        };
        
        const response = await axios.post(uploadUrl, file.buffer, { headers });
        return `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
      } catch (err) {
        console.error("Backblaze upload failed:", err.response?.data || err.message);
        throw new Error("File upload failed");
      }
    }

    // Upload album cover
    const imageFileName = imageFile ? `albums/${Date.now()}_${imageFile.originalname}` : null;
    const imageUrl = imageFile ? await uploadFile(imageFile, imageFileName) : null;

    // Create album entry in DB
    const newAlbum = new Album({
      albumName,
      description,
      artistId: creator,
      imageUrl,
    });

    await newAlbum.save();

    // Process and upload each track
    const trackPromises = audioFiles.map(async (audioFile, index) => {

      const audioFileName = `songs/${Date.now()}_${audioFile.originalname}`;

      // Extract metadata (duration)
      const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
      const durationInSeconds = Math.floor(metadata.format.duration || 0);
      const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, "0")}`;

      // Upload to Backblaze
      const audioUrl = await uploadFile(audioFile, audioFileName);

      // Save track in DB
      const newTrack = new Track({
        trackName: parsedTitles[index] || audioFile.originalname.split(".")[0], // Use filename as track title if not provided
        description,
        audioUrl,
        artistId: creator,
        albumId: newAlbum._id, // Link track to album
        duration: formattedDuration,
        imageUrl,
      });

      return newTrack.save();
    });

    // Wait for all tracks to be saved
    const savedTracks = await Promise.all(trackPromises);

    // Send response
    res.status(201).json({ 
      message: "Album uploaded successfully!", 
      album: newAlbum, 
      tracks: savedTracks 
    });

  } catch (error) {
    console.error("Backblaze upload failed:", error.response?.data || error.message);
    res.status(500).json({ message: "Something went wrong", error: error.message });
    throw error;
  }
};





//Get all tracks(Singles)
export const getAllTracks = async (req, res) => {
  try {
    const tracks = await Track.find().populate('albumId', 'albumName').populate('artistId', 'name').exec();
    return res.status(200).json({success: true, tracks,
    });
    
  } catch (error) {
    console.error("Error fetching tracks:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
  }
}

//Get Individual tracks based on the artistId 
export const getIndiviualTracks = async (req, res) => {
  try {
    const artistId = req.user._id
    const tracks = await Track.find({ artistId }).populate('albumId', 'albumName').populate('artistId', 'name').exec();
    return res.status(200).json({success: true, tracks,
    });
    
  } catch (error) {
    console.error("Error fetching tracks:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
  }
  return res.status(200).json({ success: true, tracks });
}


// Fetch all albums
export const getAllAlbums = async (req, res) => {
  try {

    const albums = await Album.find().populate('artistId', 'name').exec();

    return res.status(200).json({success: true, albums,
    });
  } catch (error) {
    console.log("Error Fetching albums");
    res.status(500).json({success: false, message: error.message})
  };
}


//Get Individual Album based on the artistId 
export const getIndiviualAlbums = async (req, res) => {
  try {
    const artistId = req.user._id

    const albums = await Album.find({ artistId }).populate('artistId', 'name').exec();

    return res.status(200).json({success: true, albums,
    });
  } catch (error) {
    console.log("Error Fetching albums");
    res.status(500).json({success: false, message: error.message})
  };
}