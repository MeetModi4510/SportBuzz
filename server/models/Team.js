import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        unique: true
    },
    captain: {
        type: String,
        trim: true
    },
    acronym: {
        type: String,
        trim: true,
        uppercase: true,
        maxLength: 5
    },
    players: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    logo: {
        type: String
    },
    color: {
        type: String,
        default: '#3b82f6' // Default Blue-500
    }
}, {
    timestamps: true
});

/**
 * Normalize a single player entry to { name, role } format.
 * Handles:
 *  - Plain strings: "Virat Kohli" → { name: "Virat Kohli", role: "Batsman" }
 *  - Already correct: { name: "Kohli", role: "Bowler" } → unchanged
 *  - Mongoose-corrupted character-indexed objects: {"0":"V","1":"i",...} → reconstruct string
 *  - Subdocs with _id but empty name: { _id: ..., name: undefined } → reconstruct from chars if possible
 */
function normalizePlayer(p) {
    if (!p) return null;

    // Plain string
    if (typeof p === 'string') {
        return { name: p, role: 'Batsman', battingStyle: 'Right-hand Bat', bowlingStyle: 'None' };
    }

    // Already correct format with a real name
    if (typeof p === 'object' && p.name && typeof p.name === 'string' && p.name.length > 0) {
        return { 
            name: p.name, 
            role: p.role || 'Batsman', 
            photo: p.photo || '',
            battingStyle: p.battingStyle || 'Right-hand Bat',
            bowlingStyle: p.bowlingStyle || 'None'
        };
    }

    // Character-indexed object (Mongoose corruption of legacy strings)
    if (typeof p === 'object') {
        // Check if it has numeric keys like "0", "1", "2"...
        if ('0' in p) {
            let str = '';
            let i = 0;
            while (p[String(i)] !== undefined) {
                str += p[String(i)];
                i++;
            }
            if (str.length > 0) {
                return { 
                    name: str, 
                    role: p.role || 'Batsman', 
                    photo: p.photo || '',
                    battingStyle: p.battingStyle || 'Right-hand Bat',
                    bowlingStyle: p.bowlingStyle || 'None'
                };
            }
        }
    }

    return null;
}

// Auto-migrate legacy player entries on every read
function migratePlayersIfNeeded(doc) {
    if (!doc || !doc.players || !Array.isArray(doc.players) || doc.players.length === 0) return;

    let changed = false;
    const migrated = [];

    for (const p of doc.players) {
        const normalized = normalizePlayer(p);
        if (!normalized) continue;

        // Detect if migration was needed
        if (typeof p === 'string' || (typeof p === 'object' && '0' in p) || (typeof p === 'object' && !p.name)) {
            changed = true;
        }
        migrated.push(normalized);
    }

    doc.players = migrated;

    // Persist the fix in the DB so it only runs once per team
    if (changed) {
        mongoose.model('Team').updateOne(
            { _id: doc._id },
            { $set: { players: migrated } }
        ).exec().catch(() => { });
    }
}

teamSchema.post('findOne', migratePlayersIfNeeded);
teamSchema.post('find', function (docs) {
    if (Array.isArray(docs)) docs.forEach(migratePlayersIfNeeded);
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
