import mongoose from 'mongoose';

const fotmobCacheSchema = new mongoose.Schema({
    endpoint: { type: String, required: true, index: true }, // e.g., "/fotmob-table/77"
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    cacheExpiry: { type: Date, required: true, index: true },
    lastFetched: { type: Date, default: Date.now },
}, { timestamps: true });

const FotmobCache = mongoose.model('FotmobCache', fotmobCacheSchema);
export default FotmobCache;
