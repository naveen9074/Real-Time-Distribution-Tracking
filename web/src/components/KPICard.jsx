/**
 * KPICard — displays a single key performance metric on the dashboard.
 *
 * Animation strategy:
 *   The `animKey` prop is a counter that increments each time the value changes.
 *   Changing the React `key` on the value element forces React to remount it,
 *   which re-triggers the CSS `animate-count-up` animation — no JS animation
 *   library needed, just CSS keyframes.
 *
 * Props:
 *   title      {string}  — metric label (e.g. "Total Revenue Today")
 *   value      {string}  — formatted value string
 *   subtitle   {string}  — secondary line below the value
 *   icon       {string}  — emoji icon
 *   gradient   {string}  — CSS class for text gradient color
 *   glowClass  {string}  — CSS class for box-shadow glow variant
 *   accent     {string}  — Tailwind class for icon background color
 *   animKey    {number}  — increment this to re-trigger the count-up animation
 */
export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  glowClass,
  accent,
  animKey = 0,
}) {
  return (
    <div className={`glass-card ${glowClass} p-6 flex flex-col gap-4`}>
      {/* Icon + title row */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-xl flex-shrink-0`}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest leading-tight">
          {title}
        </span>
      </div>

      {/* Value — remounting via animKey re-plays the count-up CSS animation */}
      <div
        key={animKey}
        className={`text-4xl font-extrabold ${gradient} animate-count-up tabular-nums`}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-slate-500 -mt-2">{subtitle}</p>
      )}
    </div>
  );
}
