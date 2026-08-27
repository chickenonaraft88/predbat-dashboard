import { useState } from 'react'

import type { RawPlan } from './api/types'
import { BaselineSummaryCard } from './components/BaselineSummaryCard'
import { ConnectionBar } from './components/ConnectionBar'
import { DebugColumnsToggle } from './components/DebugColumnsToggle'
import { HistoryTable } from './components/HistoryTable'
import { PlanChart } from './components/PlanChart'
import { PlanTable } from './components/PlanTable'
import { PlanViewSwitcher, type PlanView } from './components/PlanViewSwitcher'
import { StalePlanBanner } from './components/StalePlanBanner'
import { StatusCard } from './components/StatusCard'
import { useDebugColumns } from './hooks/useDebugColumns'
import { useNow } from './hooks/useNow'
import { usePlanData } from './hooks/usePredbat'
import { useSharedHover } from './hooks/useSharedHover'

const EMPTY_MESSAGE: Record<PlanView, string> = {
  plan: 'Predbat has not published a plan yet.',
  history: 'Predbat has no history for yesterday yet.',
  baseline: 'Predbat has no baseline data for yesterday yet.',
}

function PlanTabContent({ plan, now }: { plan?: RawPlan; now: Date }) {
  const { hoveredTime, setHoveredTime } = useSharedHover()
  const [debugColumns, setDebugColumns] = useDebugColumns()

  if (!plan || plan.rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{EMPTY_MESSAGE.plan}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <StalePlanBanner timestamp={plan.timestamp} now={now} />
      <PlanChart rows={plan.rows} now={now} hoveredTime={hoveredTime} onHoverChange={setHoveredTime} />
      <DebugColumnsToggle enabled={debugColumns} onChange={setDebugColumns} />
      <PlanTable plan={plan} hoveredTime={hoveredTime} onHoverRow={setHoveredTime} debugColumns={debugColumns} />
    </div>
  )
}

function HistoryTabContent({ plan }: { plan?: RawPlan }) {
  if (!plan || plan.rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{EMPTY_MESSAGE.history}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <PlanChart rows={plan.rows} />
      <HistoryTable rows={plan.rows} />
    </div>
  )
}

function BaselineTabContent({ yesterday, baseline }: { yesterday?: RawPlan; baseline?: RawPlan }) {
  const rows = baseline?.rows ?? []
  if (!baseline || rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{EMPTY_MESSAGE.baseline}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <BaselineSummaryCard actual={yesterday?.totals} baseline={baseline.totals} />
      <PlanChart rows={rows} />
      <PlanTable plan={baseline} />
    </div>
  )
}

function PlanSection() {
  const [view, setView] = useState<PlanView>('plan')
  const planData = usePlanData()
  const now = useNow()

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Plan</h2>
        <PlanViewSwitcher value={view} onChange={setView} />
      </div>

      {planData.isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading plan...</p>}
      {planData.isError && <p className="text-sm text-red-600 dark:text-red-400">{(planData.error as Error).message}</p>}
      {planData.isSuccess && view === 'plan' && <PlanTabContent plan={planData.data.plan ?? undefined} now={now} />}
      {planData.isSuccess && view === 'history' && <HistoryTabContent plan={planData.data.yesterday ?? undefined} />}
      {planData.isSuccess && view === 'baseline' && (
        <BaselineTabContent yesterday={planData.data.yesterday ?? undefined} baseline={planData.data.baseline ?? undefined} />
      )}
    </section>
  )
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ConnectionBar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <header>
          <h1 className="text-xl font-semibold">Predbat Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A standalone dashboard for Predbat, talking directly to its JSON API.</p>
        </header>
        <StatusCard />
        <PlanSection />
      </main>
    </div>
  )
}
