import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
    trackName: { type: String, required: true },
    description: { type: String },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    audioUrl: { type: String, required: true },  // Cloudflare R2 link
    imageUrl: { type: String, required: true },  // Cloudflare R2 link
    createdAt: { type: Date, default: Date.now }
})

const trackModel = mongoose.model('Track', trackSchema);

export default trackModel;
