import mongoose from 'mongoose';

const bdFutbolCacheSchema = new mongoose.Schema({
    stadiumId: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }, // Data persists permanently now
});

const BDFutbolCache = mongoose.model('BDFutbolPermanentCache', bdFutbolCacheSchema);
export default BDFutbolCache;
