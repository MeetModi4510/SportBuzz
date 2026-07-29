const fs = require('fs');
let src = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

// Replace React.useState/useEffect/useMemo/useCallback with named imports
src = src.replace(/React\.useState</g, 'useState<');
src = src.replace(/React\.useState\(/g, 'useState(');
src = src.replace(/React\.useEffect\(/g, 'useEffect(');
src = src.replace(/React\.useMemo\(/g, 'useMemo(');
src = src.replace(/React\.useCallback\(/g, 'useCallback(');

fs.writeFileSync('src/pages/MatchDetails.tsx', src);
console.log('Done!');
