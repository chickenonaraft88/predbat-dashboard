import { useState } from 'react'

import { useConnection } from '../api/connection'
import { usePing } from '../hooks/usePredbat'

export function ConnectionBar() {
  const { baseUrl, setBaseUrl } = useConnection()
  const [draft, setDraft] = useState(baseUrl)
  const ping = usePing()

  const status = ping.isLoading ? 'checking' : ping.isError ? 'unreachable' : ping.data?.result === 'ok' ? 'connected' : 'error'

  const dotClass = {
    checking: 'bg-slate-400',
    connected: 'bg-emerald-500',
    unreachable: 'bg-red-500',
    error: 'bg-amber-500',
  }[status]

  return (
    <form
      className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
      onSubmit={(event) => {
        event.preventDefault()
        setBaseUrl(draft.trim().replace(/\/$/, ''))
      }}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        Predbat URL
        <input
          className="w-64 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="http://homeassistant.local:5052"
          spellCheck={false}
        />
      </label>
      <button
        type="submit"
        className="rounded bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={draft.trim() === baseUrl}
      >
        Connect
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {status === 'unreachable' && 'Could not reach this URL - check web_cors_origins in apps.yaml.'}
      </span>
    </form>
  )
}
