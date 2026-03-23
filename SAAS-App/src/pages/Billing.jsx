import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, FREE_PLAN_LIMIT, PRO_PLAN_LIMIT } from '../context/ProjectsContext'

const Billing = () => {
  const { getPlanInfo, upgradePlan } = useProjects()
  const [planInfo, setPlanInfo] = useState({ plan: 'free', renderLimit: FREE_PLAN_LIMIT, rendersUsed: 0 })
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  const loadPlan = async () => {
    setLoading(true)
    try {
      const info = await getPlanInfo()
      setPlanInfo(info)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      await upgradePlan()
      await loadPlan()
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Usage & Billing</h1>
        <p className="text-gray-400 mb-8">Track usage and upgrade your plan.</p>

        {loading ? (
          <p className="text-gray-400">Loading billing details...</p>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-400 mb-2">Current plan</p>
              <h2 className="text-2xl font-bold capitalize">{planInfo.plan}</h2>
              <p className="text-gray-300 mt-2">
                Renders used: {planInfo.rendersUsed} / {planInfo.renderLimit}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-gray-400 mt-2">{FREE_PLAN_LIMIT} renders</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/40 rounded-2xl p-6">
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-gray-300 mt-2">{PRO_PLAN_LIMIT} renders</p>
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

