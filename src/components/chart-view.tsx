import { Fragment } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { RecordRow } from '@/lib/types'
import type { Visualization } from '@/lib/chart-utils'
import {
  prepareLineData,
  prepareBooleanBarData,
  computeSummaryStats,
  prepareBooleanDonutData,
  prepareSelectDonutData,
  prepareSelectBarData,
} from '@/lib/chart-utils'

interface ChartViewProps {
  visualizations: Visualization[]
  records: RecordRow[]
}

const COLORS = ['#00d4ff', '#a78bfa', '#ec4899', '#34d399', '#fbbf24']

/** Format a YYYY-MM-DD HH:mm string for compact axis display. */
function formatDateTick(value: string): string {
  if (typeof value !== 'string') return String(value)
  // "2024-03-15 10:00" → "3/15 10:00"
  const parts = value.split(' ')
  const datePart = parts[0]
  const timePart = parts[1]
  const [, month, day] = datePart.split('-')
  const shortDate = `${parseInt(month)}/${parseInt(day)}`
  return timePart ? `${shortDate} ${timePart}` : shortDate
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(18,24,33,0.95)',
    border: '1px solid #00d4ff',
    borderRadius: 8,
  },
  labelStyle: { color: '#e2e8f0' },
  itemStyle: { color: '#e2e8f0' },
}

export function ChartView({ visualizations, records }: ChartViewProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visualizations.map((viz, i) => {
        switch (viz.type) {
          case 'line':
            return <LineChartCard key={i} viz={viz} records={records} />
          case 'bar':
            return <BarChartCard key={i} viz={viz} records={records} />
          case 'summary':
            return <SummaryCard key={i} viz={viz} records={records} />
          case 'donut':
            return <DonutChartCard key={i} viz={viz} records={records} />
          case 'selectDonut':
            return <SelectDonutChartCard key={i} viz={viz} records={records} />
          case 'selectBar':
            return <SelectBarChartCard key={i} viz={viz} records={records} />
          default:
            return null
        }
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Line chart                                                         */
/* ------------------------------------------------------------------ */

function LineChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'line' }>
  records: RecordRow[]
}) {
  const data = prepareLineData(records, viz.dateColumn, viz.valueColumns)

  if (data.length === 0) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDateTick}
          />
          <YAxis
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          {viz.valueColumns.map((col, idx) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Bar chart                                                          */
/* ------------------------------------------------------------------ */

function BarChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'bar' }>
  records: RecordRow[]
}) {
  const data = prepareBooleanBarData(records, viz.dateColumn, viz.booleanColumns)

  if (data.length === 0) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDateTick}
          />
          <YAxis
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          {viz.booleanColumns.map((col, idx) => (
            <Fragment key={col}>
              <Bar
                dataKey={`${col}_true`}
                stackId={col}
                fill={COLORS[idx % COLORS.length]}
                name={`${col} (true)`}
              />
              <Bar
                dataKey={`${col}_false`}
                stackId={col}
                fill={COLORS[idx % COLORS.length]}
                fillOpacity={0.3}
                name={`${col} (false)`}
              />
            </Fragment>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Summary stats                                                      */
/* ------------------------------------------------------------------ */

function SummaryCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'summary' }>
  records: RecordRow[]
}) {
  const stats = computeSummaryStats(records, viz.valueColumns)

  if (stats.every((s) => s.count === 0)) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4 space-y-4">
      {stats.map((s) => (
        <div key={s.column}>
          <h3 className="glow-cyan text-sm font-semibold mb-2">{s.column}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatItem label="Sum" value={s.sum} />
            <StatItem label="Avg" value={s.avg} />
            <StatItem label="Min" value={s.min} />
            <StatItem label="Max" value={s.max} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[rgba(100,150,255,0.05)] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-mono font-medium text-foreground">
        {Number.isInteger(value) ? value : value.toFixed(2)}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Donut chart                                                        */
/* ------------------------------------------------------------------ */

function DonutChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'donut' }>
  records: RecordRow[]
}) {
  const donutData = prepareBooleanDonutData(records, viz.booleanColumns)

  if (donutData.every((d) => d.trueCount + d.falseCount === 0)) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {donutData.map((d, idx) => {
          const pieData = [
            { name: 'True', value: d.trueCount },
            { name: 'False', value: d.falseCount },
          ]
          const color = COLORS[idx % COLORS.length]

          return (
            <div key={d.column} className="text-center">
              <h3 className="glow-cyan text-sm font-semibold mb-1">
                {d.column}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    <Cell fill={color} />
                    <Cell fill={color} fillOpacity={0.3} />
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Select donut chart                                                 */
/* ------------------------------------------------------------------ */

function SelectDonutChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'selectDonut' }>
  records: RecordRow[]
}) {
  const donutData = prepareSelectDonutData(records, viz.selectColumns)

  if (donutData.every((d) => d.slices.length === 0)) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  return (
    <div className="tech-card rounded-xl p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {donutData.map((d) => {
          const pieData = d.slices.map((s) => ({ name: s.value, value: s.count }))

          return (
            <div key={d.column} className="text-center">
              <h3 className="glow-cyan text-sm font-semibold mb-1">
                {d.column}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Select bar chart                                                   */
/* ------------------------------------------------------------------ */

function SelectBarChartCard({
  viz,
  records,
}: {
  viz: Extract<Visualization, { type: 'selectBar' }>
  records: RecordRow[]
}) {
  const data = prepareSelectBarData(records, viz.dateColumn, viz.selectColumn)

  if (data.length === 0) {
    return (
      <div className="tech-card rounded-xl p-4 text-muted-foreground text-sm">
        Not enough data to chart
      </div>
    )
  }

  // Collect all unique values to create bars
  const uniqueValues = new Set<string>()
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (key !== 'date') uniqueValues.add(key)
    }
  }
  const values = [...uniqueValues]

  return (
    <div className="tech-card rounded-xl p-4">
      <h3 className="glow-cyan text-sm font-semibold mb-2">{viz.selectColumn}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,150,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDateTick}
          />
          <YAxis
            stroke="rgba(100,150,255,0.5)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          {values.map((val, idx) => (
            <Bar
              key={val}
              dataKey={val}
              stackId="select"
              fill={COLORS[idx % COLORS.length]}
              name={val}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
