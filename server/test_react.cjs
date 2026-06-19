const stats = {"matches":{"test":"45","odi":"34","t20":"21","ipl":"0"},"innings":{"test":"83","odi":"34","t20":"21","ipl":"0"}};
const formats = ['test', 'odi', 't20', 'ipl'];
const hasData = formats.some(f => stats.matches && stats.matches[f] && stats.matches[f] !== '0');
console.log('hasData:', hasData);
const rows = formats.map(format => {
    if (!stats.matches || !stats.matches[format] || stats.matches[format] === '0') return null;
    return format;
});
console.log('rows:', rows);
