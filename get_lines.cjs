const fs = require('fs');
const lines = fs.readFileSync('src/components/VenueAnalysisPanel.tsx', 'utf8').split('\n');

const lucideLine = lines.findIndex(l => l.includes('from "lucide-react"'));
console.log('Lucide line:', lucideLine + 1);

const dynamicGalleryLine = lines.findIndex(l => l.includes('const [dynamicGallery, setDynamicGallery]'));
console.log('Dynamic Gallery line:', dynamicGalleryLine + 1);

const galleryStartLine = lines.findIndex(l => l.includes('Stadium Gallery') && l.includes('{/*'));
console.log('Gallery start line:', galleryStartLine + 1);
console.log('Total lines:', lines.length);
