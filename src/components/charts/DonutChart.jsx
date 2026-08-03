/**
 * Lightweight SVG donut/pie chart — no chart library dependency.
 * segments: [{ label, value, color, displayValue }]
 */
export default function DonutChart({
  segments = [],
  size = 248,
  thickness = 38,
  centerLabel = '',
  centerValue = '',
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, Number(s.value) || 0), 0)
  const radius = size / 2
  const inner = Math.max(radius - thickness, 0)
  const cx = radius
  const cy = radius

  function polar(r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function arcPath(startAngle, endAngle) {
    const large = endAngle - startAngle > 180 ? 1 : 0
    const s = polar(radius, endAngle)
    const e = polar(radius, startAngle)
    const s2 = polar(inner, endAngle)
    const e2 = polar(inner, startAngle)

    return [
      `M ${s.x} ${s.y}`,
      `A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y}`,
      `L ${e2.x} ${e2.y}`,
      `A ${inner} ${inner} 0 ${large} 1 ${s2.x} ${s2.y}`,
      'Z',
    ].join(' ')
  }

  let angle = 0
  const slices =
    total <= 0
      ? []
      : segments
          .filter((s) => Number(s.value) > 0)
          .map((s) => {
            const value = Number(s.value) || 0
            const sweep = (value / total) * 360
            const start = angle
            const end = angle + sweep
            angle = end
            const safeEnd = sweep >= 359.999 ? start + 359.999 : end
            return {
              ...s,
              value,
              path: arcPath(start, safeEnd),
              pct: Math.round((value / total) * 100),
            }
          })

  return (
    <div className="donut">
      <div className="donut__visual" style={{ width: size, height: size }}>
        <svg
          className="donut__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={centerLabel || 'Chart'}
        >
          {total <= 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={(radius + inner) / 2}
              fill="none"
              stroke="rgba(20,35,28,0.12)"
              strokeWidth={thickness}
            />
          ) : (
            slices.map((slice) => (
              <path
                key={slice.label}
                d={slice.path}
                fill={slice.color}
                stroke="rgba(255,253,248,0.55)"
                strokeWidth="1.5"
              />
            ))
          )}
        </svg>
        <div className="donut__center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className="donut__legend">
        {segments.map((s) => {
          const value = Number(s.value) || 0
          const pct = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <li key={s.label}>
              <span
                className="donut__swatch"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              <div className="donut__legend-copy">
                <div className="donut__legend-top">
                  <strong>{s.label}</strong>
                  <em>{pct}%</em>
                </div>
                <span className="donut__legend-value">
                  {s.displayValue ?? value}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
