import { getUploadUrl } from "../config/backblaze.js";
import Track from "../models/trackModel.js";
import Album from "../models/albumModel.js";
import userModel from "../models/creatorModel.js";




export const getCreatorProfile = async (req, res) => {
    const { creatorId } = req.params;

    try {
        const creator = await userModel.findById(creatorId).select('-password -verifyotp -resetOtp')

        if (!creator){
            return res.status(404).json({ success: false, message: 'Creator not found'})
        }

        // Fetch number of albums and tracks
        const albums = await Album.find({ artistId: creatorId });
        const tracks = await Track.find({ artistId: creatorId });

        return res.json({
            success: true,
            creator: {
                _id: creator._id,
                name:  creator.name,
                bio: creator.bio,
                profileImage: creator.profileImage,
                email: creator.email,
                totalAlbums: albums.length,
                totalTracks: tracks.length

            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Update Profile

export const updateCreatorProfile = async (req, res) => {
    const userId = req.user._id;
    const { bio, profileImage } = req.body;

    try {
        const user = await userModel.findByIdAndUpdate(
            userId,
            { bio, profileImage },
            { new: true }
        );
        return res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
};