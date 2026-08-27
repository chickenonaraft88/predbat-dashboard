import type { MouseHandlerDataParam } from 'recharts'
import { Area, AreaChart, CartesianGrid, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { PlanRow } from '../api/types'
import { useNow } from '../hooks/useNow'
import { resolveHoveredRowTime } from '../lib/chartHover'
import { findNowRowTime } from '../lib/planTime'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PlanChart({
  rows,
  now,
  hoveredTime,
  onHoverChange,
}: {
  rows: PlanRow[]
  now?: Date
  /** The row time (matches PlanRow.time) the table currently has hovered, or null/undefined for none. */
  hoveredTime?: string | null
  /** Called with a row time on chart hover, and null on chart mouse-leave - lets the table mirror it. */
  onHoverChange?: (time: string | null) => void
}) {
  const internalNow = useNow()
  const effectiveNow = now ?? internalNow
  const data = rows.map((row) => ({
    time: formatTime(row.time),
    rawTime: row.time,
    soc: row.soc_percent,
    importRate: row.import_rate,
    exportRate: row.export_rate,
    pvForecast: row.pv_forecast,
    loadForecast: row.load_forecast,
  }))
  const nowRowTime = findNowRowTime(rows, effectiveNow)
  const nowLabel = nowRowTime ? formatTime(nowRowTime) : undefined
  const hoveredLabel = hoveredTime ? formatTime(hoveredTime) : undefined

  function handleMouseMove(state: MouseHandlerDataParam) {
    if (!onHoverChange) return
    onHoverChange(resolveHoveredRowTime(data, state.activeLabel))
  }

  function handleMouseLeave() {
    onHoverChange?.(null)
  }

  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis yAxisId="soc" domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
          <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 11 }} width={36} />
          <YAxis yAxisId="energy" hide domain={[0, 'dataMax']} />
          <Tooltip />
          <Legend />
          {nowLabel && <ReferenceLine yAxisId="soc" x={nowLabel} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Now', position: 'insideTopRight', fill: '#f97316', fontSize: 11 }} />}
          {hoveredLabel && hoveredLabel !== nowLabel && <ReferenceLine yAxisId="soc" x={hoveredLabel} stroke="#6366f1" strokeDasharray="2 2" data-testid="hover-reference-line" />}
          <Area yAxisId="energy" type="monotone" dataKey="pvForecast" name="PV kWh" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} />
          <Area yAxisId="energy" type="monotone" dataKey="loadForecast" name="Load kWh" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.12} />
          <Area yAxisId="soc" type="stepAfter" dataKey="soc" name="SOC %" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} />
          <Line yAxisId="rate" type="stepAfter" dataKey="importRate" name="Import p/kWh" stroke="#dc2626" dot={false} />
          <Line yAxisId="rate" type="stepAfter" dataKey="exportRate" name="Export p/kWh" stroke="#16a34a" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
