
const convertUTCtoIST = (utcDateTime) => {
    if (!utcDateTime) return "Invalid Date";
    try {
        const date = new Date(utcDateTime);
        console.log(`Input: ${utcDateTime}`);
        console.log(`Parsed Date: ${date.toISOString()}`);

        return date.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch (e) {
        return "Error: " + e.message;
    }
};

const testDates = [
    "2026-02-08T05:30:00Z", // The problematic date
    "2024-02-08T05:30:00",  // Missing Z
    new Date().toISOString() // Current time
];

testDates.forEach(date => {
    console.log(`Original: ${date} -> IST: ${convertUTCtoIST(date)}`);
    console.log("---------------------------------------------------");
});
