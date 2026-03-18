import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { account } from '../lib/appwrite'
import { useNavigate, Link } from 'react-router-dom'

const ChangePassword = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirm) {
      return setError('New passwords do not match.')
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.')
    }

    setLoading(true)
    try {
      await account.updatePassword(newPassword, oldPassword)
      setSuccess('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Back to dashboard
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Change Password
        </h2>
        <p className="mt-2 text-center text-sm font-normal text-indigo-400">
          Logged in as <span className="font-semibold text-white">{user?.email}</span>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium text-gray-100"
            >
              Current password
            </label>
            <div className="mt-2">
              <input
                id="oldPassword"
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-100"
            >
              New password
            </label>
            <div className="mt-2">
              <input
                id="newPassword"
                type="password"
                minLength={8}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-100"
            >
              Confirm new password
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                type="password"
                minLength={8}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePassword
