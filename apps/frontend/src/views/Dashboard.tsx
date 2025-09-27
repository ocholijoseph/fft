import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axios from 'axios'

type Insight = { message: string }
type Summary = { monthTotal: number, lastMonthTotal: number }
type Category = { name: string, value: number }
type TrendPoint = { date: string, total: number }

export function Dashboard() {
  const [insight, setInsight] = useState<Insight | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, c, t, i] = await Promise.all([
          axios.get('/api/dashboard/summary'),
          axios.get('/api/dashboard/categories'),
          axios.get('/api/dashboard/trend'),
          axios.get('/api/insights/tip')
        ])
        setSummary(s.data)
        setCategories(c.data)
        setTrend(t.data)
        setInsight(i.data)
      } catch (e) {
        // fallback demo data
        setSummary({ monthTotal: 1250, lastMonthTotal: 980 })
        setCategories([
          { name: 'Groceries', value: 320 },
          { name: 'Transport', value: 120 },
          { name: 'Bills', value: 400 },
          { name: 'Education', value: 180 },
          { name: 'Entertainment', value: 150 },
          { name: 'Healthcare', value: 80 }
        ])
        setTrend([
          { date: '2025-05', total: 900 },
          { date: '2025-06', total: 1020 },
          { date: '2025-07', total: 980 },
          { date: '2025-08', total: 1130 },
          { date: '2025-09', total: 1250 }
        ])
        setInsight({ message: 'You spent 27% more this month vs last month on bills.' })
      }
    }
    fetchData()
  }, [])

  const monthChange = summary ? summary.monthTotal - summary.lastMonthTotal : 0
  const pct = summary && summary.lastMonthTotal > 0 ? Math.round((monthChange / summary.lastMonthTotal) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Monthly Summary</h2>
          {summary && (
            <span className={`text-sm ${pct >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{pct >= 0 ? '+' : ''}{pct}%</span>
          )}
        </div>
        <p className="text-3xl font-bold mt-2">${summary?.monthTotal?.toLocaleString() ?? '—'}</p>
        <p className="text-gray-500 text-sm">Last month: ${summary?.lastMonthTotal?.toLocaleString() ?? '—'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold">AI Tip</h2>
        <p className="text-gray-700 mt-2">{insight?.message ?? 'Analyzing your spending patterns...'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold mb-4">Spending Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSpending)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

