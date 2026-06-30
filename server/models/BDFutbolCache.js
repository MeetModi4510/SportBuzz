import mongoose from 'mongoose';

const bdFutbolCacheSchema = new mongoose.Schema({
    stadiumId: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: '24h' }, // MongoDB TTL auto-deletes after 24h
});

const BDFutbolCache = mongoose.model('BDFutbolCache', bdFutbolCacheSchema);
export default BDFutbolCache;
