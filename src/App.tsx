import { ConnectionBar } from './components/ConnectionBar'
import { PlanChart } from './components/PlanChart'
import { PlanTable } from './components/PlanTable'
import { StatusCard } from './components/StatusCard'
import { usePlanData } from './hooks/usePredbat'

function PlanSection() {
  const planData = usePlanData()

  if (planData.isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading plan...</p>
  }
  if (planData.isError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{(planData.error as Error).message}</p>
  }

  const rows = planData.data?.plan?.rows ?? []
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Predbat has not published a plan yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <PlanChart rows={rows} />
      <PlanTable rows={rows} overrides={planData.data?.overrides} />
    </div>
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
        <section>
          <h2 className="mb-2 text-lg font-medium">Plan</h2>
          <PlanSection />
        </section>
      </main>
    </div>
  )
}
