import { Area, AreaChart, CartesianGrid, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { PlanRow } from '../api/types'
import { useNow } from '../hooks/useNow'
import { findNowRowTime } from '../lib/planTime'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PlanChart({ rows, now }: { rows: PlanRow[]; now?: Date }) {
  const internalNow = useNow()
  const effectiveNow = now ?? internalNow
  const data = rows.map((row) => ({
    time: formatTime(row.time),
    soc: row.soc_percent,
    importRate: row.import_rate,
    exportRate: row.export_rate,
  }))
  const nowRowTime = findNowRowTime(rows, effectiveNow)
  const nowLabel = nowRowTime ? formatTime(nowRowTime) : undefined

  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis yAxisId="soc" domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
          <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Legend />
          {nowLabel && <ReferenceLine yAxisId="soc" x={nowLabel} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Now', position: 'insideTopRight', fill: '#f97316', fontSize: 11 }} />}
          <Area yAxisId="soc" type="stepAfter" dataKey="soc" name="SOC %" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} />
          <Line yAxisId="rate" type="stepAfter" dataKey="importRate" name="Import p/kWh" stroke="#dc2626" dot={false} />
          <Line yAxisId="rate" type="stepAfter" dataKey="exportRate" name="Export p/kWh" stroke="#16a34a" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
