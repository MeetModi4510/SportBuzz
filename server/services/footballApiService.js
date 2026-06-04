
/**
 * Football API Service
 * Handles football data fetching and mock generation
 */

// Mock Matches Generator
const getMockMatches = () => {
    return [
        {
            id: "fm1",
            sport: "football",
            matchType: "Premier League",
            homeTeam: { id: "fh1", name: "Arsenal", shortName: "ARS", logo: "https://media.api-sports.io/football/teams/42.png", primaryColor: "#EF0107" },
            awayTeam: { id: "fa1", name: "Liverpool", shortName: "LIV", logo: "https://media.api-sports.io/football/teams/40.png", primaryColor: "#C8102E" },
            homeScore: "2",
            awayScore: "1",
            status: "live",
            currentMinute: "78",
            venue: { name: "Emirates Stadium", city: "London" },
            startTime: new Date().toISOString()
        },
        {
            id: "fm2",
            sport: "football",
            matchType: "La Liga",
            homeTeam: { id: "fh2", name: "Real Madrid", shortName: "RMA", logo: "https://media.api-sports.io/football/teams/541.png", primaryColor: "#FFFFFF" },
            awayTeam: { id: "fa2", name: "Barcelona", shortName: "BAR", logo: "https://media.api-sports.io/football/teams/529.png", primaryColor: "#004D98" },
            homeScore: "3",
            awayScore: "1",
            status: "completed",
            venue: { name: "Santiago Bernabéu", city: "Madrid" },
            startTime: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
            id: "fm3",
            sport: "football",
            matchType: "Serie A",
            homeTeam: { id: "fh3", name: "Juventus", shortName: "JUV", logo: "https://media.api-sports.io/football/teams/496.png", primaryColor: "#000000" },
            awayTeam: { id: "fa3", name: "AC Milan", shortName: "MIL", logo: "https://media.api-sports.io/football/teams/489.png", primaryColor: "#FB090B" },
            homeScore: "0",
            awayScore: "0",
            status: "upcoming",
            venue: { name: "Allianz Stadium", city: "Turin" },
            startTime: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        }
    ];
};

// Mock Squads Generator with full 11-player lineups, formations, captains, and jersey numbers
const getMockSquads = (matchId) => {
    // 1. Argentina vs France (World Cup Final)
    if (matchId === 'f4') {
        return {
            homeFormation: "4-3-3",
            awayFormation: "4-2-3-1",
            homeTeam: [
                { id: "ar1", name: "Emiliano Martínez", role: "Goalkeeper", number: 23, image: "https://img.a.transfermarkt.technology/portrait/header/111870.jpg", matchStats: { saves: 7, savesInsideBox: 4, punches: 2, highClaims: 3, accurateLongBalls: 8, touches: 48, minutesPlayed: 120, passAccuracy: 72, passes: 28, rating: 8.6, goalsConceded: 3 } },
                { id: "ar2", name: "Nahuel Molina", role: "Defender", number: 26, image: "https://img.a.transfermarkt.technology/portrait/header/568177.jpg", matchStats: { assists: 1, tackles: 3, interceptions: 2, clearances: 4, blockedShots: 1, keyPasses: 1, passes: 41, passAccuracy: 81, crosses: 3, touches: 65, minutesPlayed: 120, rating: 7.4 } },
                { id: "ar3", name: "Cristian Romero", role: "Defender", number: 13, image: "https://img.a.transfermarkt.technology/portrait/header/355933.jpg", matchStats: { tackles: 5, interceptions: 3, clearances: 7, duelsWon: 8, fouls: 2, passes: 52, passAccuracy: 88, touches: 70, minutesPlayed: 120, rating: 7.8 } },
                { id: "ar4", name: "Nicolás Otamendi", role: "Defender", number: 19, image: "https://img.a.transfermarkt.technology/portrait/header/54781.jpg", matchStats: { tackles: 4, interceptions: 4, clearances: 6, blockedShots: 2, fouls: 1, passes: 58, passAccuracy: 85, touches: 75, minutesPlayed: 120, rating: 7.5 } },
                { id: "ar5", name: "Nicolás Tagliafico", role: "Defender", number: 3, image: "https://img.a.transfermarkt.technology/portrait/header/123558.jpg", matchStats: { tackles: 2, interceptions: 1, clearances: 3, duelsWon: 4, passes: 35, passAccuracy: 79, touches: 52, minutesPlayed: 120, rating: 6.9 } },
                { id: "ar6", name: "Rodrigo De Paul", role: "Midfielder", number: 7, image: "https://img.a.transfermarkt.technology/portrait/header/167669.jpg", matchStats: { passes: 67, passAccuracy: 89, keyPasses: 2, tackles: 4, interceptions: 2, duelsWon: 6, shots: 1, shotsOnTarget: 0, touches: 88, minutesPlayed: 120, rating: 7.6 } },
                { id: "ar7", name: "Enzo Fernández", role: "Midfielder", number: 24, image: "https://img.a.transfermarkt.technology/portrait/header/602324.jpg", matchStats: { passes: 72, passAccuracy: 91, keyPasses: 3, accurateLongBalls: 6, tackles: 3, shots: 2, shotsOnTarget: 1, touches: 95, yellowCards: 1, minutesPlayed: 120, rating: 7.8 } },
                { id: "ar8", name: "Alexis Mac Allister", role: "Midfielder", number: 20, image: "https://img.a.transfermarkt.technology/portrait/header/532831.jpg", matchStats: { assists: 1, passes: 55, passAccuracy: 87, keyPasses: 2, tackles: 2, shots: 1, shotsOnTarget: 1, touches: 72, minutesPlayed: 120, rating: 7.5 } },
                { id: "ar9", name: "Lionel Messi", role: "Forward", number: 10, isCaptain: true, image: "https://img.a.transfermarkt.technology/portrait/header/28003.jpg", matchStats: { goals: 2, assists: 1, shots: 5, shotsOnTarget: 4, keyPasses: 5, dribblesCompleted: 6, duelsWon: 7, passAccuracy: 87, passes: 48, touches: 85, minutesPlayed: 120, rating: 9.8 } },
                { id: "ar10", name: "Julián Álvarez", role: "Forward", number: 9, image: "https://img.a.transfermarkt.technology/portrait/header/576024.jpg", matchStats: { goals: 0, assists: 1, shots: 3, shotsOnTarget: 2, keyPasses: 2, dribblesCompleted: 2, passes: 22, passAccuracy: 78, touches: 42, minutesPlayed: 103, rating: 7.1, substitutedOut: "103'" } },
                { id: "ar11", name: "Ángel Di María", role: "Forward", number: 11, image: "https://img.a.transfermarkt.technology/portrait/header/45320.jpg", matchStats: { goals: 1, assists: 0, shots: 2, shotsOnTarget: 1, keyPasses: 3, dribblesCompleted: 4, passes: 18, passAccuracy: 82, touches: 45, minutesPlayed: 64, rating: 8.2, substitutedOut: "64'" } },
                // Substitutes
                { id: "ar12", name: "Marcos Acuña", role: "Defender", number: 8, image: "https://img.a.transfermarkt.technology/portrait/header/60453.jpg", isSubstitute: true, matchStats: { tackles: 1, passes: 12, passAccuracy: 75, touches: 22, minutesPlayed: 56, substitutedIn: "64'" } },
                { id: "ar13", name: "Gonzalo Montiel", role: "Defender", number: 4, image: "https://img.a.transfermarkt.technology/portrait/header/402733.jpg", isSubstitute: true, matchStats: { tackles: 2, passes: 8, passAccuracy: 88, penaltyGoal: 1, touches: 15, minutesPlayed: 29, substitutedIn: "91'" } },
                { id: "ar14", name: "Leandro Paredes", role: "Midfielder", number: 5, image: "https://img.a.transfermarkt.technology/portrait/header/166237.jpg", isSubstitute: true, matchStats: { passes: 14, passAccuracy: 86, tackles: 1, touches: 18, minutesPlayed: 18, substitutedIn: "102'" } },
                { id: "ar15", name: "Paulo Dybala", role: "Forward", number: 21, image: "https://img.a.transfermarkt.technology/portrait/header/206050.jpg", isSubstitute: true, matchStats: { shots: 0, passes: 2, penaltyGoal: 1, touches: 4, minutesPlayed: 1, substitutedIn: "120'" } },
                { id: "ar16", name: "Lautaro Martínez", role: "Forward", number: 22, image: "https://img.a.transfermarkt.technology/portrait/header/280730.jpg", isSubstitute: true, matchStats: { goals: 0, shots: 1, shotsOnTarget: 0, passes: 5, passAccuracy: 80, touches: 9, minutesPlayed: 17, substitutedIn: "103'" } }
            ],
            awayTeam: [
                { id: "fr1", name: "Hugo Lloris", role: "Goalkeeper", number: 1, isCaptain: true, image: "https://img.a.transfermarkt.technology/portrait/header/17965.jpg", matchStats: { saves: 3, savesInsideBox: 2, punches: 1, highClaims: 2, accurateLongBalls: 6, touches: 40, minutesPlayed: 120, passes: 22, passAccuracy: 65, rating: 6.8, goalsConceded: 3 } },
                { id: "fr2", name: "Jules Koundé", role: "Defender", number: 5, image: "https://img.a.transfermarkt.technology/portrait/header/411975.jpg", matchStats: { tackles: 3, interceptions: 2, clearances: 3, passes: 45, passAccuracy: 82, touches: 68, minutesPlayed: 120, rating: 7.0 } },
                { id: "fr3", name: "Raphaël Varane", role: "Defender", number: 4, image: "https://img.a.transfermarkt.technology/portrait/header/164770.jpg", matchStats: { tackles: 4, interceptions: 3, clearances: 8, blockedShots: 2, passes: 50, passAccuracy: 86, touches: 73, minutesPlayed: 120, rating: 7.2 } },
                { id: "fr4", name: "Dayot Upamecano", role: "Defender", number: 3, image: "https://img.a.transfermarkt.technology/portrait/header/344695.jpg", matchStats: { tackles: 3, interceptions: 2, clearances: 5, fouls: 2, passes: 38, passAccuracy: 80, touches: 62, minutesPlayed: 120, rating: 6.5 } },
                { id: "fr5", name: "Theo Hernández", role: "Defender", number: 22, image: "https://img.a.transfermarkt.technology/portrait/header/339808.jpg", matchStats: { tackles: 1, assists: 0, keyPasses: 1, dribblesCompleted: 2, passes: 32, passAccuracy: 76, touches: 58, minutesPlayed: 120, rating: 6.4 } },
                { id: "fr6", name: "Aurélien Tchouaméni", role: "Midfielder", number: 8, image: "https://img.a.transfermarkt.technology/portrait/header/413112.jpg", matchStats: { passes: 58, passAccuracy: 84, keyPasses: 1, tackles: 5, interceptions: 3, duelsWon: 7, shots: 1, shotsOnTarget: 0, touches: 82, minutesPlayed: 120, rating: 7.3 } },
                { id: "fr7", name: "Adrien Rabiot", role: "Midfielder", number: 14, image: "https://img.a.transfermarkt.technology/portrait/header/182712.jpg", matchStats: { passes: 42, passAccuracy: 78, tackles: 2, interceptions: 1, touches: 65, yellowCards: 1, minutesPlayed: 120, rating: 6.6 } },
                { id: "fr8", name: "Antoine Griezmann", role: "Midfielder", number: 7, image: "https://img.a.transfermarkt.technology/portrait/header/125414.jpg", matchStats: { assists: 0, shots: 2, shotsOnTarget: 0, keyPasses: 3, accurateCrosses: 2, tackles: 3, passes: 36, passAccuracy: 83, touches: 60, minutesPlayed: 120, rating: 6.8 } },
                { id: "fr9", name: "Ousmane Dembélé", role: "Forward", number: 11, image: "https://img.a.transfermarkt.technology/portrait/header/288230.jpg", matchStats: { assists: 1, shots: 3, shotsOnTarget: 1, keyPasses: 2, dribblesCompleted: 3, passes: 24, passAccuracy: 74, touches: 48, minutesPlayed: 120, rating: 7.0 } },
                { id: "fr10", name: "Olivier Giroud", role: "Forward", number: 9, image: "https://img.a.transfermarkt.technology/portrait/header/82009.jpg", matchStats: { goals: 0, shots: 1, shotsOnTarget: 0, aerialDuelsWon: 4, yellowCards: 1, passes: 15, passAccuracy: 68, touches: 28, minutesPlayed: 120, rating: 5.9 } },
                { id: "fr11", name: "Kylian Mbappé", role: "Forward", number: 10, image: "https://img.a.transfermarkt.technology/portrait/header/342229.jpg", matchStats: { goals: 3, assists: 0, shots: 7, shotsOnTarget: 5, keyPasses: 2, dribblesCompleted: 8, duelsWon: 5, passes: 20, passAccuracy: 75, touches: 55, minutesPlayed: 120, rating: 9.9 } },
                // Substitutes
                { id: "fr12", name: "Eduardo Camavinga", role: "Midfielder", number: 25, image: "https://img.a.transfermarkt.technology/portrait/header/640428.jpg", isSubstitute: true, matchStats: { tackles: 4, passes: 18, passAccuracy: 85, touches: 35, minutesPlayed: 49, substitutedIn: "71'" } },
                { id: "fr13", name: "Kingsley Coman", role: "Forward", number: 20, image: "https://img.a.transfermarkt.technology/portrait/header/280623.jpg", isSubstitute: true, matchStats: { dribblesCompleted: 3, keyPasses: 1, touches: 25, minutesPlayed: 49, substitutedIn: "71'" } },
                { id: "fr14", name: "Marcus Thuram", role: "Forward", number: 15, image: "https://img.a.transfermarkt.technology/portrait/header/257468.jpg", isSubstitute: true, matchStats: { assists: 1, shots: 2, touches: 30, minutesPlayed: 79, substitutedIn: "41'" } },
                { id: "fr15", name: "Ibrahima Konaté", role: "Defender", number: 21, image: "https://img.a.transfermarkt.technology/portrait/header/357119.jpg", isSubstitute: true, matchStats: { clearances: 2, touches: 15, minutesPlayed: 7, substitutedIn: "113'" } },
                { id: "fr16", name: "Randal Kolo Muani", role: "Forward", number: 12, image: "https://img.a.transfermarkt.technology/portrait/header/487969.jpg", isSubstitute: true, matchStats: { shots: 1, shotsOnTarget: 1, keyPasses: 1, touches: 22, minutesPlayed: 79, substitutedIn: "41'" } }
            ]
        };
    }

    // 2. Man Utd vs Liverpool
    if (matchId === 'f1') {
        return {
            homeFormation: "4-3-3",
            awayFormation: "4-3-3",
            homeTeam: [
                { id: "mu1", name: "André Onana", role: "Goalkeeper", number: 24, image: "https://media.api-sports.io/football/players/52679.png" },
                { id: "mu2", name: "Diogo Dalot", role: "Defender", number: 20, image: "https://media.api-sports.io/football/players/899.png" },
                { id: "mu3", name: "Harry Maguire", role: "Defender", number: 5, image: "https://media.api-sports.io/football/players/2939.png" },
                { id: "mu4", name: "Lisandro Martínez", role: "Defender", number: 6, image: "https://media.api-sports.io/football/players/35181.png" },
                { id: "mu5", name: "Luke Shaw", role: "Defender", number: 23, image: "https://media.api-sports.io/football/players/892.png" },
                { id: "mu6", name: "Casemiro", role: "Midfielder", number: 18, image: "https://media.api-sports.io/football/players/747.png" },
                { id: "mu7", name: "Kobbie Mainoo", role: "Midfielder", number: 37, image: "https://media.api-sports.io/football/players/386043.png" },
                { id: "mu8", name: "Bruno Fernandes", role: "Midfielder", number: 8, isCaptain: true, image: "https://media.api-sports.io/football/players/1210.png", matchStats: { goals: 1 } },
                { id: "mu9", name: "Alejandro Garnacho", role: "Forward", number: 17, image: "https://media.api-sports.io/football/players/284323.png" },
                { id: "mu10", name: "Rasmus Højlund", role: "Forward", number: 11, image: "https://media.api-sports.io/football/players/284439.png", matchStats: { goals: 1 } },
                { id: "mu11", name: "Marcus Rashford", role: "Forward", number: 10, image: "https://media.api-sports.io/football/players/909.png" },
                // Substitutes
                { id: "mu12", name: "Christian Eriksen", role: "Midfielder", number: 14, image: "https://media.api-sports.io/football/players/164.png", isSubstitute: true },
                { id: "mu13", name: "Antony", role: "Forward", number: 21, image: "https://media.api-sports.io/football/players/923.png", isSubstitute: true },
                { id: "mu14", name: "Scott McTominay", role: "Midfielder", number: 39, image: "https://media.api-sports.io/football/players/18882.png", isSubstitute: true },
                { id: "mu15", name: "Mason Mount", role: "Midfielder", number: 7, image: "https://media.api-sports.io/football/players/18939.png", isSubstitute: true },
                { id: "mu16", name: "Victor Lindelöf", role: "Defender", number: 2, image: "https://media.api-sports.io/football/players/883.png", isSubstitute: true }
            ],
            awayTeam: [
                { id: "li1", name: "Alisson Becker", role: "Goalkeeper", number: 1, image: "https://media.api-sports.io/football/players/280.png" },
                { id: "li2", name: "Trent Alexander-Arnold", role: "Defender", number: 66, image: "https://media.api-sports.io/football/players/287.png", matchStats: { assists: 1 } },
                { id: "li3", name: "Ibrahima Konaté", role: "Defender", number: 5, image: "https://media.api-sports.io/football/players/41019.png" },
                { id: "li4", name: "Virgil van Dijk", role: "Defender", number: 4, isCaptain: true, image: "https://media.api-sports.io/football/players/290.png" },
                { id: "li5", name: "Andrew Robertson", role: "Defender", number: 26, image: "https://media.api-sports.io/football/players/289.png" },
                { id: "li6", name: "Wataru Endo", role: "Midfielder", number: 3, image: "https://media.api-sports.io/football/players/712.png" },
                { id: "li7", name: "Alexis Mac Allister", role: "Midfielder", number: 10, image: "https://media.api-sports.io/football/players/35817.png" },
                { id: "li8", name: "Dominik Szoboszlai", role: "Midfielder", number: 8, image: "https://media.api-sports.io/football/players/156689.png" },
                { id: "li9", name: "Mohamed Salah", role: "Forward", number: 11, image: "https://media.api-sports.io/football/players/306.png", matchStats: { goals: 1 } },
                { id: "li10", name: "Darwin Núñez", role: "Forward", number: 9, image: "https://media.api-sports.io/football/players/150772.png" },
                { id: "li11", name: "Luis Díaz", role: "Forward", number: 7, image: "https://media.api-sports.io/football/players/50221.png" },
                // Substitutes
                { id: "li12", name: "Caoimhin Kelleher", role: "Goalkeeper", number: 62, image: "https://media.api-sports.io/football/players/282.png", isSubstitute: true },
                { id: "li13", name: "Harvey Elliott", role: "Midfielder", number: 19, image: "https://media.api-sports.io/football/players/156689.png", isSubstitute: true },
                { id: "li14", name: "Cody Gakpo", role: "Forward", number: 18, image: "https://media.api-sports.io/football/players/8499.png", isSubstitute: true },
                { id: "li15", name: "Joe Gomez", role: "Defender", number: 2, image: "https://media.api-sports.io/football/players/293.png", isSubstitute: true },
                { id: "li16", name: "Curtis Jones", role: "Midfielder", number: 17, image: "https://media.api-sports.io/football/players/156689.png", isSubstitute: true }
            ]
        };
    }

    // 3. Real Madrid vs Barcelona
    if (matchId === 'f2') {
        return {
            homeFormation: "4-3-3",
            awayFormation: "4-3-3",
            homeTeam: [
                { id: "rm1", name: "Thibaut Courtois", role: "Goalkeeper", number: 1, image: "https://media.api-sports.io/football/players/735.png" },
                { id: "rm2", name: "Dani Carvajal", role: "Defender", number: 2, image: "https://media.api-sports.io/football/players/742.png" },
                { id: "rm3", name: "Antonio Rüdiger", role: "Defender", number: 22, image: "https://media.api-sports.io/football/players/136.png" },
                { id: "rm4", name: "Éder Militão", role: "Defender", number: 3, image: "https://media.api-sports.io/football/players/50212.png" },
                { id: "rm5", name: "Ferland Mendy", role: "Defender", number: 23, image: "https://media.api-sports.io/football/players/2288.png" },
                { id: "rm6", name: "Aurélien Tchouaméni", role: "Midfielder", number: 18, image: "https://media.api-sports.io/football/players/49257.png" },
                { id: "rm7", name: "Federico Valverde", role: "Midfielder", number: 15, image: "https://media.api-sports.io/football/players/642.png" },
                { id: "rm8", name: "Jude Bellingham", role: "Midfielder", number: 5, image: "https://media.api-sports.io/football/players/162966.png", matchStats: { yellowCards: 1 } },
                { id: "rm9", name: "Rodrygo", role: "Forward", number: 11, image: "https://media.api-sports.io/football/players/50216.png" },
                { id: "rm10", name: "Kylian Mbappé", role: "Forward", number: 9, isCaptain: true, image: "https://media.api-sports.io/football/players/278.png" },
                { id: "rm11", name: "Vinícius Júnior", role: "Forward", number: 7, image: "https://media.api-sports.io/football/players/2467.png" },
                // Substitutes
                { id: "rm12", name: "Luka Modrić", role: "Midfielder", number: 10, image: "https://media.api-sports.io/football/players/757.png", isSubstitute: true },
                { id: "rm13", name: "Lucas Vázquez", role: "Defender", number: 17, image: "https://media.api-sports.io/football/players/744.png", isSubstitute: true },
                { id: "rm14", name: "Brahim Díaz", role: "Midfielder", number: 21, image: "https://media.api-sports.io/football/players/49.png", isSubstitute: true },
                { id: "rm15", name: "Dani Ceballos", role: "Midfielder", number: 19, image: "https://media.api-sports.io/football/players/44.png", isSubstitute: true },
                { id: "rm16", name: "Fran García", role: "Defender", number: 20, image: "https://media.api-sports.io/football/players/30784.png", isSubstitute: true }
            ],
            awayTeam: [
                { id: "ba1", name: "Marc-André ter Stegen", role: "Goalkeeper", number: 1, image: "https://media.api-sports.io/football/players/763.png" },
                { id: "ba2", name: "Jules Koundé", role: "Defender", number: 23, image: "https://media.api-sports.io/football/players/21805.png" },
                { id: "ba3", name: "Ronald Araújo", role: "Defender", number: 4, image: "https://media.api-sports.io/football/players/50218.png" },
                { id: "ba4", name: "Pau Cubarsí", role: "Defender", number: 2, image: "https://media.api-sports.io/football/players/432360.png" },
                { id: "ba5", name: "Alejandro Balde", role: "Defender", number: 28, image: "https://media.api-sports.io/football/players/35816.png" },
                { id: "ba6", name: "Frenkie de Jong", role: "Midfielder", number: 21, image: "https://media.api-sports.io/football/players/756.png" },
                { id: "ba7", name: "Pedri", role: "Midfielder", number: 8, isCaptain: true, image: "https://media.api-sports.io/football/players/156947.png" },
                { id: "ba8", name: "Ilkay Gündogan", role: "Midfielder", number: 22, image: "https://media.api-sports.io/football/players/624.png" },
                { id: "ba9", name: "Lamine Yamal", role: "Forward", number: 19, image: "https://media.api-sports.io/football/players/382173.png" },
                { id: "ba10", name: "Robert Lewandowski", role: "Forward", number: 9, image: "https://media.api-sports.io/football/players/521.png" },
                { id: "ba11", name: "Raphinha", role: "Forward", number: 11, image: "https://media.api-sports.io/football/players/553.png" },
                // Substitutes
                { id: "ba12", name: "Ferran Torres", role: "Forward", number: 7, image: "https://media.api-sports.io/football/players/97.png", isSubstitute: true },
                { id: "ba13", name: "João Félix", role: "Forward", number: 14, image: "https://media.api-sports.io/football/players/127.png", isSubstitute: true },
                { id: "ba14", name: "Andreas Christensen", role: "Defender", number: 15, image: "https://media.api-sports.io/football/players/114.png", isSubstitute: true },
                { id: "ba15", name: "Oriol Romeu", role: "Midfielder", number: 18, image: "https://media.api-sports.io/football/players/145.png", isSubstitute: true },
                { id: "ba16", name: "Fermín López", role: "Midfielder", number: 16, image: "https://media.api-sports.io/football/players/432360.png", isSubstitute: true }
            ]
        };
    }

    // Default Mock Squads (Generic 4-4-2)
    return {
        homeFormation: "4-4-2",
        awayFormation: "4-4-2",
        homeTeam: Array.from({ length: 11 }, (_, i) => ({
            id: `fh${i}`,
            name: `Home Player ${i + 1}`,
            number: i + 1,
            role: i === 0 ? "Goalkeeper" : i < 5 ? "Defender" : i < 9 ? "Midfielder" : "Forward",
            image: "",
            isCaptain: i === 5
        })),
        awayTeam: Array.from({ length: 11 }, (_, i) => ({
            id: `fa${i}`,
            name: `Away Player ${i + 1}`,
            number: i + 1,
            role: i === 0 ? "Goalkeeper" : i < 5 ? "Defender" : i < 9 ? "Midfielder" : "Forward",
            image: "",
            isCaptain: i === 5
        }))
    };
};

/**
 * Get match squads
 */
export const getMatches = async () => {
    return getMockMatches();
};

export const getMatchSquads = async (matchId) => {
    // In future: Fetch from real Football API if key available
    return getMockSquads(matchId);
};

export default {
    getMatches,
    getMatchSquads
};
