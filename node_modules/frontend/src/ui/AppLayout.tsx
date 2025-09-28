import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr]">
      <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-md" />
            <span className="font-semibold">Family Finance</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link className="text-sm text-gray-700 hover:text-indigo-600" to="/">Dashboard</Link>
            <a className="text-sm text-gray-700 hover:text-indigo-600" href="/auth/google">Login</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

