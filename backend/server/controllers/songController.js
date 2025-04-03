import { b2, getUploadUrl } from "../config/backblaze.js";
import Track from "../models/trackModel.js";
import dotenv from "dotenv";
import axios from "axios";
import { parseBuffer } from "music-metadata";

dotenv.config();

export const uploadTrack = async (req, res) => {
  try {
    const { title, description } = req.body;
    const audioFile = req.files['audio'][0];
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const creator = req.user._id;

    // 🔹 Get upload URL
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

    const audioFileName = `songs/${Date.now()}_${audioFile.originalname}`;
    const imageFileName = imageFile ? `covers/${Date.now()}_${imageFile.originalname}` : null;

    const audioUrl = await uploadFile(audioFile, audioFileName);
    const imageUrl = imageFile ? await uploadFile(imageFile, imageFileName) : null;

    // 🔹 Extract audio metadata (duration)
    const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
    const durationInSeconds = Math.floor(metadata.format.duration || 0);
    const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, "0")}`;


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

