import { useState, useEffect, useRef } from "react";

const logoCache: Record<string, string | null> = {};
const pendingRequests: Record<string, Promise<string | null>> = {};

const fetchQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    while (fetchQueue.length > 0) {
        const task = fetchQueue.shift();
        if (task) {
            await task();
            // 250ms delay between requests to avoid rate limits (4 per sec)
            await new Promise(r => setTimeout(r, 250)); 
        }
    }
    isProcessingQueue = false;
};

const queueFetch = (task: () => Promise<void>) => {
    fetchQueue.push(task);
    processQueue();
};

export const DynamicLogo = ({ name, fallbackIcon: FallbackIcon, localDomain, isCompetition = false }: { name: string, fallbackIcon: any, localDomain?: string, isCompetition?: boolean }) => {
    // If localDomain is a direct URL (like /images/logos/pl.png), use it immediately!
    const isDirectUrl = localDomain?.startsWith("http") || localDomain?.startsWith("/");
    const initialLogo = isDirectUrl ? localDomain : (logoCache[name] || null);

    const [logo, setLogo] = useState<string | null>(initialLogo);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(!!isDirectUrl);
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!observerRef.current || hasAttempted) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" } // Fetch a bit before it enters the screen
        );
        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [hasAttempted]);

    useEffect(() => {
        if (!isVisible || logo || hasAttempted) return;
        
        if (logoCache[name] !== undefined) {
            setLogo(logoCache[name]);
            setHasAttempted(true);
            return;
        }

        // For competitions, we skip TheSportsDB search since their free API doesn't support generic league name search easily,
        // and we already have high quality local domains/favicons for them.
        if (isCompetition) {
            setHasAttempted(true);
            return;
        }

        const fetchLogo = async () => {
            try {
                if (!pendingRequests[name]) {
                    pendingRequests[name] = fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.teams && data.teams.length > 0) {
                                return data.teams[0].strBadge;
                            }
                            return null;
                        })
                        .catch(() => null);
                }
                
                const foundLogo = await pendingRequests[name];
                logoCache[name] = foundLogo;
                setLogo(foundLogo);
            } catch (err) {
                logoCache[name] = null;
            } finally {
                setHasAttempted(true);
            }
        };

        queueFetch(fetchLogo);
    }, [name, isVisible, logo, hasAttempted, isCompetition]);

    return (
        <div ref={observerRef} className="w-full h-full flex items-center justify-center">
            {logo ? (
                <img 
                    src={logo} 
                    alt={name} 
                    className="w-full h-full object-contain drop-shadow-sm scale-110" 
                />
            ) : localDomain && !isDirectUrl ? (
                <img 
                    src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${localDomain}&size=128`} 
                    alt={name} 
                    className="w-full h-full object-cover" 
                />
            ) : (
                <FallbackIcon size={14} className="text-muted-foreground" />
            )}
        </div>
    );
};
