import mongoose from 'mongoose';

async function test() {
    await mongoose.connect('mongodb+srv://meetmodi45:MeetModi-45@sportbuzz.bfrawfb.mongodb.net/SportBuzz?appName=SportBuzz');
    const User = mongoose.connection.db.collection('users');
    const Team = mongoose.connection.db.collection('teams');
    
    // Find Heet Bhuva
    const user = await User.findOne({ fullName: 'Heet Bhuva' });
    console.log("Found user Heet:", user._id);
    
    // Try the find query manually
    const teams = await Team.find({ 
        $or: [
            { "players.userId": user._id },
            { "players.userId": user._id.toString() },
            { "captainId": user._id },
            { "captainId": user._id.toString() }
        ]
    }).toArray();
    
    console.log("Found teams matching Heet:", teams.length);
    console.log(teams.map(t => t.name));
    
    process.exit(0);
}

test();
