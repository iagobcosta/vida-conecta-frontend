export const statusChartColors = {
  created: '#2563eb',
  scheduled: '#d97706',
  confirmed: '#0f766e',
  cancelled: '#b91c1c',
  inProgress: '#047857',
  completed: '#64748b',
} as const

export type ChartSeries = {
  key: string
  label: string
  color: string
  values: number[]
}

function maxValue(series: ChartSeries[]) {
  return Math.max(1, ...series.flatMap((item) => item.values))
}

function niceMax(value: number) {
  if (value <= 4) {
    return 4
  }
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

type LineChartProps = {
  labels: string[]
  series: ChartSeries[]
}

export function LineChart({ labels, series }: LineChartProps) {
  const width = 640
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 32 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const yMax = niceMax(maxValue(series))
  const xStep = labels.length <= 1 ? innerWidth : innerWidth / (labels.length - 1)

  function x(index: number) {
    return padding.left + index * xStep
  }

  function y(value: number) {
    return padding.top + innerHeight - (value / yMax) * innerHeight
  }

  const ticks = [0, yMax / 2, yMax]
  const labelEvery = labels.length > 14 ? 7 : labels.length > 8 ? 4 : 1

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Evolução das consultas">
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#e2e8f0"
          />
          <text x={padding.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {tick}
          </text>
        </g>
      ))}
      {series.map((item) => {
        const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
        return (
          <polyline
            key={item.key}
            fill="none"
            stroke={item.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
        )
      })}
      {labels.map((label, index) =>
        index % labelEvery === 0 || index === labels.length - 1 ? (
          <text
            key={label + index}
            x={x(index)}
            y={height - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

type StackedBarChartProps = {
  labels: string[]
  series: ChartSeries[]
}

export function StackedBarChart({ labels, series }: StackedBarChartProps) {
  const width = 640
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 32 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const stacked = labels.map((_, index) => series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0))
  const yMax = niceMax(Math.max(1, ...stacked))
  const gap = 4
  const barWidth = Math.max(4, innerWidth / labels.length - gap)
  const labelEvery = labels.length > 14 ? 7 : labels.length > 8 ? 3 : 1

  function y(value: number) {
    return padding.top + innerHeight - (value / yMax) * innerHeight
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Consultas por status no período">
      {[0, yMax / 2, yMax].map((tick) => (
        <g key={tick}>
          <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" />
          <text x={padding.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {tick}
          </text>
        </g>
      ))}
      {labels.map((label, index) => {
        const x = padding.left + index * (innerWidth / labels.length) + gap / 2
        let offset = 0
        return (
          <g key={label + index}>
            {series.map((item) => {
              const value = item.values[index] ?? 0
              const barHeight = (value / yMax) * innerHeight
              const yPos = padding.top + innerHeight - offset - barHeight
              offset += barHeight
              if (barHeight <= 0) {
                return null
              }
              return <rect key={item.key} x={x} y={yPos} width={barWidth} height={barHeight} fill={item.color} rx="1" />
            })}
            {index % labelEvery === 0 || index === labels.length - 1 ? (
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {label}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

type DonutChartProps = {
  segments: Array<{ label: string; value: number; color: string }>
}

export function DonutChart({ segments }: DonutChartProps) {
  const total = segments.reduce((sum, item) => sum + item.value, 0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36" role="img" aria-label="Distribuição por status">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {total === 0 ? null : (
          <g transform="rotate(-90 70 70)">
            {segments.map((segment) => {
              const length = (segment.value / total) * circumference
              const circle = (
                <circle
                  key={segment.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="16"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += length
              return circle
            })}
          </g>
        )}
        <text x="70" y="66" textAnchor="middle" className="fill-slate-900 text-xl font-semibold">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-slate-500 text-[11px]">
          consultas
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
            <span className="text-slate-600">{segment.label}</span>
            <span className="font-medium text-slate-900">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChartLegend({ series }: { series: Array<{ label: string; color: string }> }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
      {series.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
