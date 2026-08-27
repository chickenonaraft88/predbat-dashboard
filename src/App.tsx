import { useState } from 'react'

import type { PlanRow } from './api/types'
import { ConnectionBar } from './components/ConnectionBar'
import { HistoryTable } from './components/HistoryTable'
import { PlanChart } from './components/PlanChart'
import { PlanTable } from './components/PlanTable'
import { PlanViewSwitcher, type PlanView } from './components/PlanViewSwitcher'
import { StatusCard } from './components/StatusCard'
import { usePlanData } from './hooks/usePredbat'

const EMPTY_MESSAGE: Record<PlanView, string> = {
  plan: 'Predbat has not published a plan yet.',
  history: 'Predbat has no history for yesterday yet.',
  baseline: 'Predbat has no baseline data for yesterday yet.',
}

function PlanTabContent({ view, rows }: { view: PlanView; rows: PlanRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{EMPTY_MESSAGE[view]}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <PlanChart rows={rows} />
      {view === 'history' ? <HistoryTable rows={rows} /> : <PlanTable rows={rows} />}
    </div>
  )
}

function PlanSection() {
  const [view, setView] = useState<PlanView>('plan')
  const planData = usePlanData()

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Plan</h2>
        <PlanViewSwitcher value={view} onChange={setView} />
      </div>

      {planData.isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading plan...</p>}
      {planData.isError && <p className="text-sm text-red-600 dark:text-red-400">{(planData.error as Error).message}</p>}
      {planData.isSuccess && (
        <PlanTabContent
          view={view}
          rows={(view === 'plan' ? planData.data.plan?.rows : view === 'history' ? planData.data.yesterday?.rows : planData.data.baseline?.rows) ?? []}
        />
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
