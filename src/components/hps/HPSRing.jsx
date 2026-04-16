export function HPSRing({ score, maxScore = 1000, size = 200, strokeWidth = 12, tier, ci }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - progress);

  const tierColors = {
    "CENTENARIAN": "#D97706",
    "MASTERY": "#A855F7",
    "RESILIENCE": "#0F9F8F",
    "LONGEVITY": "#4F46E5",
    "VITALITY": "#7B35D8",
    "FOUNDATION": "#F59E0B",
    "AWAKENING": "#EF4444",
  };
  const color = tierColors[tier?.tier] || "#7B35D8";

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="hps-ring-main">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {/* Progress ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="ring-progress" style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-bold text-stellar tracking-tighter" data-testid="hps-score-value">
          {Math.round(score)}
        </span>
        <span className="font-mono text-xs text-stellar-dim tracking-wider mt-0.5">/ {maxScore}</span>
        {ci && <span className="font-mono text-[10px] text-stellar-dim mt-1">±{ci} pts</span>}
        {tier && (
          <span className="font-mono text-[10px] font-bold mt-1 tracking-widest uppercase"
            style={{ color }}>{tier.tier}</span>
        )}
      </div>
    </div>
  );
}

export function PillarRing({ name, score, maxPoints, percentage, color, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxPoints, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2" data-testid={`pillar-ring-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="ring-progress" style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold text-stellar">{Math.round(score)}</span>
          <span className="font-mono text-[8px] text-stellar-dim">/{maxPoints}</span>
        </div>
      </div>
      <span className="font-mono text-[10px] text-stellar-dim tracking-wider uppercase text-center leading-tight">{name}</span>
      <span className="font-mono text-[9px]" style={{ color }}>{percentage}%</span>
    </div>
  );
}
