const fs = require('fs');
const overNum = 81.3;
const commentaryBalls = (overNum * 6) + 0;
console.log("commentaryBalls:", commentaryBalls);

const str = "287/9 (81.2 ov)";
console.log(str.replace("81.2", "81.3"));
