import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, FREE_PLAN_LIMIT, PRO_PLAN_LIMIT } from '../context/ProjectsContext'

const Billing = () => {
  const { getPlanInfo, upgradePlan } = useProjects()
  const [planInfo, setPlanInfo] = useState({ plan: 'free', renderLimit: FREE_PLAN_LIMIT, rendersUsed: 0 })
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlan = useCallback(async () => {
    setLoading(true)
    try {
      const info = await getPlanInfo()
      setPlanInfo(info)
    } finally {
      setLoading(false)
    }
  }, [getPlanInfo])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      await upgradePlan()
      await loadPlan()
    } finally {
      setUpgrading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadPlan()
    } finally {
      setRefreshing(false)
    }
  }

  const usedPct = Math.min(100, Math.round((planInfo.rendersUsed / Math.max(1, planInfo.renderLimit)) * 100))
  const rendersLeft = Math.max(0, planInfo.renderLimit - planInfo.rendersUsed)
  const over80 = usedPct >= 80

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Usage & Billing</h1>
        <p className="text-gray-400 mb-8">Track render usage, current plan, and upgrade options.</p>

        {loading ? (
          <p className="text-gray-400">Loading billing details...</p>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Current plan</p>
                  <h2 className="text-2xl font-bold capitalize">{planInfo.plan}</h2>
                </div>
                <button
                  onClick={handleRefresh}
                  className="border border-white/10 hover:border-indigo-500/50 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <p className="text-gray-300 mt-4">
                Renders used: {planInfo.rendersUsed} / {planInfo.renderLimit} ({usedPct}%)
              </p>
              <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${over80 ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className={`mt-3 text-sm ${over80 ? 'text-red-300' : 'text-gray-400'}`}>
                {rendersLeft} render{rendersLeft === 1 ? '' : 's'} left this cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-gray-400 mt-2">{FREE_PLAN_LIMIT} renders</p>
                <p className="text-gray-500 text-sm mt-3">Best for testing and personal use.</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/40 rounded-2xl p-6">
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-gray-300 mt-2">{PRO_PLAN_LIMIT} renders</p>
                <p className="text-gray-400 text-sm mt-3">For active creators and teams generating frequently.</p>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || planInfo.plan === 'pro'}
                  className="mt-5 bg-indigo-500 hover:bg-indigo-600 px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
                >
                  {planInfo.plan === 'pro' ? 'Current plan' : upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Billing
