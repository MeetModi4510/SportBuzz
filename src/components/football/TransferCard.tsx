import { NewTransferData } from "../../types/football/transfers";
import { ArrowRight, User, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface TransferCardProps {
  transferData: NewTransferData;
}

const FALLBACK_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEwLDEwLDEwLDAuMikiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4=';

function ClubLogo({ name, id, url, size = 32, glow, isDark }: { name: string; id: number; url?: string; size?: number; glow?: string; isDark?: boolean }) {
  const isFreeAgent =
    name.toLowerCase().includes('free agent') ||
    id === 2 ||
    name.toLowerCase().includes('retired') ||
    name.toLowerCase().includes('without');

  const logoUrl = isFreeAgent ? '' : (url || (id > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png` : ''));

  // Football badge / shield clipPath
  const shieldClip = 'polygon(50% 0%, 100% 18%, 100% 72%, 50% 100%, 0% 72%, 0% 18%)';

  return (
    <div style={{ position: 'relative', width: size, height: size * 1.1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow halo */}
      {glow && logoUrl && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${glow},0.25) 0%, transparent 70%)`,
          filter: 'blur(4px)',
        }} />
      )}
      {/* Shield */}
      <div style={{
        width: size, height: size * 1.1,
        clipPath: shieldClip,
        background: 'rgba(255,255,255,0.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: size * 0.12,
        overflow: 'hidden',
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.12)',
      }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (!t.src.includes('data:image')) {
                t.src = FALLBACK_SVG;
                t.style.opacity = '0.25';
              }
            }}
          />
        ) : (
          <User size={size * 0.4} style={{ color: 'rgba(0,0,0,0.3)' }} />
        )}
      </div>
    </div>
  );
}

export function TransferCard({ transferData }: TransferCardProps) {
  const [imgError, setImgError] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  useEffect(() => {
    setImgError(false);
  }, [transferData?.playerId, transferData?.playerImage]);

  if (!transferData) return null;

  const feeText = (typeof transferData.fee === 'string' ? transferData.fee : transferData.fee?.feeText) || '';
  const typeText = (typeof transferData.transferType === 'string' ? transferData.transferType : transferData.transferType?.text) || '';
  const priceDisplay = feeText || typeText || 'Transfer';
  const isFree = priceDisplay.toUpperCase().includes('FREE');
  const isLoan = priceDisplay.toUpperCase().includes('LOAN') || transferData.onLoan;

  const formatCurrency = (v: number) => {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v}`;
  };

  const displayFee = transferData.feeValue
    ? formatCurrency(transferData.feeValue)
    : (typeof transferData.fee === 'object' && transferData.fee?.value)
      ? formatCurrency(transferData.fee.value)
      : priceDisplay;

  const marketValueDisplay = transferData.marketValue ? formatCurrency(transferData.marketValue) : null;

  const dateObj = new Date(transferData.transferDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Accent palette
  const accentRGB = isFree ? '16,185,129' : isLoan ? '14,165,233' : '234,179,8';
  const accentHex = isFree ? '#10b981' : isLoan ? '#0ea5e9' : '#eab308';
  const accentLight = isFree ? (isDark ? '#6ee7b7' : '#059669') : isLoan ? (isDark ? '#7dd3fc' : '#0284c7') : (isDark ? '#fde047' : '#b45309');

  // Theme-aware colors
  const cardBg       = isDark ? 'linear-gradient(135deg, #141414 0%, #0e0e0e 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
  const cardShadow   = isDark ? '0 8px 28px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)';
  const nameColor    = isDark ? '#ffffff' : '#0f172a';
  const mutedColor   = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.42)';
  const faintColor   = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.28)';
  const fromClubColor = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.5)';
  const toClubColor  = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.9)';
  const stripBg      = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const stripBorder  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const dotGridColor = isDark
    ? 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)'
    : 'radial-gradient(circle, rgba(0,0,0,0.25) 1px, transparent 1px)';
  const photoFadeRight = isDark
    ? 'linear-gradient(90deg, transparent 45%, rgba(14,14,14,0.95) 100%)'
    : 'linear-gradient(90deg, transparent 45%, rgba(249,250,251,0.95) 100%)';
  const photoFadeTint = isDark
    ? `linear-gradient(160deg, rgba(${accentRGB},0.1) 0%, transparent 55%)`
    : `linear-gradient(160deg, rgba(${accentRGB},0.06) 0%, transparent 55%)`;
  const arrowBg      = isDark ? `rgba(${accentRGB},0.1)` : `rgba(${accentRGB},0.12)`;
  const arrowBorder  = isDark ? `rgba(${accentRGB},0.22)` : `rgba(${accentRGB},0.3)`;
  const accentLineClr = isDark ? `rgba(${accentRGB},0.2)` : `rgba(${accentRGB},0.3)`;
  const chipBg       = isDark ? `rgba(${accentRGB},0.1)` : `rgba(${accentRGB},0.08)`;
  const chipBorder   = isDark ? `rgba(${accentRGB},0.2)` : `rgba(${accentRGB},0.25)`;
  const chipColor    = isDark ? `rgba(${accentRGB},0.85)` : accentHex;
  const glowOverlay  = isDark
    ? `radial-gradient(ellipse at 80% 40%, rgba(${accentRGB},0.07) 0%, transparent 70%)`
    : `radial-gradient(ellipse at 80% 40%, rgba(${accentRGB},0.04) 0%, transparent 70%)`;

  const hasTmImage = !imgError && !!transferData.playerImage;
  const hasFotmobId = !imgError &&
    !!transferData.playerId &&
    !String(transferData.playerId).startsWith('/') &&
    !String(transferData.playerId).startsWith('http') &&
    !isNaN(Number(transferData.playerId));
  const fotmobUrl = `https://images.fotmob.com/image_resources/playerimages/${transferData.playerId}.png`;

  const fromLogoSrc = transferData.fromClubLogo || (transferData.fromClubId > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${transferData.fromClubId}.png` : '');
  const toLogoSrc   = transferData.toClubLogo   || (transferData.toClubId   > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${transferData.toClubId}.png`   : '');

  return (
    <div
      className="group relative shrink-0 cursor-pointer select-none"
      style={{
        width: '390px',
        height: '160px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `1px solid ${cardBorder}`,
        boxShadow: cardShadow,
        display: 'flex',
        flexDirection: 'row',
        background: cardBg,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px) scale(1.01)';
        el.style.boxShadow = `0 16px 48px rgba(0,0,0,${isDark ? '0.6' : '0.15'}), 0 0 0 1px rgba(${accentRGB},0.2)`;
        el.style.borderColor = `rgba(${accentRGB},0.28)`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0) scale(1)';
        el.style.boxShadow = cardShadow;
        el.style.borderColor = cardBorder;
      }}
    >
      {/* Accent top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`, zIndex: 10 }} />

      {/* LEFT: Photo panel */}
      <div style={{ width: 108, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {hasTmImage ? (
          <img
            key={transferData.playerImage}
            src={transferData.playerImage!}
            alt={transferData.name}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (hasFotmobId) t.src = fotmobUrl;
              else setImgError(true);
            }}
          />
        ) : hasFotmobId ? (
          <img
            src={fotmobUrl}
            alt={transferData.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}>
            <User size={28} style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }} />
          </div>
        )}
        {/* Gradient fade to card background */}
        <div style={{ position: 'absolute', inset: 0, background: photoFadeRight }} />
        {/* Accent tint */}
        <div style={{ position: 'absolute', inset: 0, background: photoFadeTint, pointerEvents: 'none' }} />
      </div>

      {/* RIGHT: Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Dot-grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: isDark ? 0.018 : 0.06, pointerEvents: 'none',
          backgroundImage: dotGridColor, backgroundSize: '16px 16px',
        }} />

        {/* Hover glow */}
        <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{ position: 'absolute', inset: 0, background: glowOverlay }} />

        {/* Info area */}
        <div style={{ flex: 1, padding: '14px 16px 8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>

          {/* Name + Fee */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: nameColor, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, minWidth: 0 }}>
              {transferData.name}
            </h3>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: accentLight, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {displayFee}
              </div>
              {marketValueDisplay && (
                <div style={{ fontSize: 9.5, color: faintColor, marginTop: 3, fontWeight: 500 }}>
                  MV {marketValueDisplay}
                </div>
              )}
            </div>
          </div>

          {/* Position chip */}
          {transferData.position?.label && (
            <span style={{
              display: 'inline-block', alignSelf: 'flex-start',
              fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: chipColor, background: chipBg, border: `1px solid ${chipBorder}`,
              borderRadius: 5, padding: '2px 6px', marginBottom: 7,
            }}>
              {transferData.position.label}
            </span>
          )}

          {/* Date row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: accentHex, opacity: 0.65, flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: mutedColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {formattedDate}
            </span>
            {(isFree || isLoan) && (
              <>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)', fontSize: 9 }}>·</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: accentHex }}>
                  {isFree ? 'Free' : 'Loan'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Transfer strip */}
        <div style={{
          borderTop: `1px solid ${stripBorder}`,
          background: stripBg,
          padding: '10px 14px 11px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          position: 'relative', zIndex: 1, overflow: 'hidden',
        }}>
          {/* Ambient watermark: FROM */}
          {fromLogoSrc && (
            <img aria-hidden="true" src={fromLogoSrc}
              style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, objectFit: 'contain', opacity: isDark ? 0.06 : 0.08, pointerEvents: 'none', filter: 'blur(0.5px)' }}
            />
          )}
          {/* Ambient watermark: TO */}
          {toLogoSrc && (
            <img aria-hidden="true" src={toLogoSrc}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, objectFit: 'contain', opacity: isDark ? 0.1 : 0.12, pointerEvents: 'none', filter: 'blur(0.5px)' }}
            />
          )}

          {/* FROM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <ClubLogo name={transferData.fromClub} id={transferData.fromClubId} url={transferData.fromClubLogo} size={28} isDark={isDark} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: fromClubColor, lineHeight: 1.3 }}>
              {transferData.fromClub}
            </span>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 10, height: 1, background: accentLineClr }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: arrowBg, border: `1px solid ${arrowBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={9} style={{ color: accentHex }} />
            </div>
            <div style={{ width: 10, height: 1, background: accentLineClr }} />
          </div>

          {/* TO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: toClubColor, lineHeight: 1.3, textAlign: 'right' }}>
              {transferData.toClub}
            </span>
            <ClubLogo name={transferData.toClub} id={transferData.toClubId} url={transferData.toClubLogo} size={28} glow={accentRGB} isDark={isDark} />
          </div>
        </div>

      </div>
    </div>
  );
}
