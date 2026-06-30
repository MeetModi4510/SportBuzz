const fs = require('fs');
const filePath = 'src/data/venueExtras.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /competitions:\s*\[([\s\S]*?)\],\s*visitingTeams:/;
const match = content.match(regex);
if (match) {
    const newCompetitions = `competitions: [
            { name: "First Division", matches: 1189 },
            { name: "Champions League", matches: 174 },
            { name: "King's Cup", matches: 138 },
            { name: "Europa League", matches: 43 },
            { name: "Cup Winners' Cup", matches: 41 },
            { name: "Fairs Cup", matches: 37 },
            { name: "Spanish Super Cup", matches: 15 },
            { name: "League Cup", matches: 5 },
            { name: "European Super Cup", matches: 2 },
            { name: "Latin Cup", matches: 2 },
            { name: "Eva Duarte Cup", matches: 1 }
        ],
        visitingTeams:`;
        
    content = content.replace(regex, newCompetitions);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated competitions successfully");
} else {
    console.log("Could not find competitions array");
}
