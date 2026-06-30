import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/sportbuzz").then(async () => {
    const db = mongoose.connection.db;
    const teams = await db.collection("teams").find({}).toArray();
    console.log(teams.map(t => ({name: t.name, captainJoinCode: t.captainJoinCode})));
    process.exit(0);
});
