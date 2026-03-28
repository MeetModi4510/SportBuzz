
const testDateParsing = (dateStr) => {
    console.log(`Testing: "${dateStr}"`);
    const date = new Date(dateStr);
    console.log(`Parsed (ISO): ${date.toISOString()}`);
    console.log(`Parsed (Local): ${date.toString()}`);

    // Test conversion to IST
    const ist = date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
    console.log(`Converted to IST: ${ist}`);
    console.log("---------------------------------------------------");
};

// Case 1: As returned by API (No Z)
testDateParsing("2026-02-06T07:30:00");

// Case 2: With Z appended
testDateParsing("2026-02-06T07:30:00" + "Z");
