const fs = require('fs');
let code = fs.readFileSync('src/components/VenueAnalysisPanel.tsx', 'utf8');

const searchTarget = '            {/*';
const index = code.lastIndexOf(searchTarget);

if (index === -1) {
    console.error('Target not found');
    process.exit(1);
}

const beforeTarget = code.substring(0, index);

const replacement = `            {/* 📸 Stadium Gallery 📸 */}
            {(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery) && (dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery)?.length > 0 && (
                <div className="mt-8 space-y-5">
                    <Section icon={<Camera size={16} style={{ color }} />} title="Stadium Gallery" subtitle="Local photos from the public folder">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery)?.map((src, idx) => (
                                <div key={idx} onClick={() => setLightboxIndex(idx)} className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer relative shadow-lg">
                                    <img src={src} alt={\`\${selectedVenue.name} photo \${idx + 1}\`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white/80 text-xs flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <Camera size={12} /> View Full
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxIndex !== null && selectedVenue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
                    {/* Close Button */}
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all" onClick={() => setLightboxIndex(null)}>
                        <X size={24} />
                    </button>
                    
                    {/* Previous Button */}
                    <button 
                        className="absolute left-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentGallery = dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery || [];
                            setLightboxIndex(prev => prev === null || prev === 0 ? currentGallery.length - 1 : prev - 1);
                        }}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    {/* Main Image */}
                    <img 
                        src={(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery || [])[lightboxIndex]} 
                        alt="Stadium Full View" 
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Next Button */}
                    <button 
                        className="absolute right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentGallery = dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery || [];
                            setLightboxIndex(prev => prev === null || prev === currentGallery.length - 1 ? 0 : prev + 1);
                        }}
                    >
                        <ChevronRight size={32} />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white/80 font-mono text-sm tracking-widest">
                        {lightboxIndex + 1} / {(dynamicGallery.length > 0 ? dynamicGallery : selectedVenue.gallery || []).length}
                    </div>
                </div>
            )}
        </div>
    );
};
`;

fs.writeFileSync('src/components/VenueAnalysisPanel.tsx', beforeTarget + replacement, 'utf8');
console.log('Successfully updated gallery modal!');
