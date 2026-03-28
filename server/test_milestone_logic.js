import { expect } from 'expect';

// Mocking the notifyMilestone function for testing
const testMilestoneLogic = (prevRuns, totalRuns, runs) => {
    let notifications = [];
    const notifyMilestone = (threshold, title, message) => {
        if (prevRuns < threshold && totalRuns >= threshold) {
            notifications.push({ title, message });
        }
    };

    const bName = "Test Batsman";
    const milestones = [
        { val: 50, near: 45, label: 'Half-Century', emoji: '🏏', reachMsg: [`A magnificent 50 for ${bName}!`], nearMsg: [`Nearing 50! ${bName} is on ${totalRuns}* runs.`] },
        { val: 100, near: 95, label: 'Century', emoji: '💯', reachMsg: [`CENTURY! 💯 ${bName} reaches the triple figures!`], nearMsg: [`Nearing a Century! ${bName} reaches ${totalRuns}*!`] },
    ];

    for (const m of milestones) {
        notifyMilestone(m.near, `Nearing ${m.label}! ${m.emoji}`, m.nearMsg[0]);
        notifyMilestone(m.val, `${m.label}! ${m.emoji}`, m.reachMsg[0]);
    }
    return notifications;
};

// Test Cases
const runTests = () => {
    // 1. Reaching 45 (Nearing 50)
    let res = testMilestoneLogic(44, 45, 1);
    console.log("Test 1 (44 -> 45):", res);
    // Expected: [{ title: 'Nearing Half-Century! 🏏', ... }]

    // 2. Reaching 50 (Reached 50)
    res = testMilestoneLogic(49, 50, 1);
    console.log("Test 2 (49 -> 50):", res);
    // Expected: [{ title: 'Half-Century! 🏏', ... }]

    // 3. Huge hit from 44 to 51 (Both nearing and reached)
    res = testMilestoneLogic(44, 51, 7);
    console.log("Test 3 (44 -> 51):", res);
    // Expected: Both milestones should trigger

    // 4. Already past nearing
    res = testMilestoneLogic(46, 47, 1);
    console.log("Test 4 (46 -> 47):", res);
    // Expected: []
};

runTests();
