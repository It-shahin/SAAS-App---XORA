import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { account } from '../lib/appwrite'
import { Link } from 'react-router-dom'
import { getSafeAuthError } from '../lib/authErrors'

const ChangePassword = () => {
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasDigit = /\d/.test(newPassword)
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword)
  const checksPassed = [hasMinLength, hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length
  const strengthLabel = checksPassed >= 5 ? 'Strong' : checksPassed >= 3 ? 'Medium' : newPassword ? 'Weak' : '—'
  const strengthColor = checksPassed >= 5 ? 'bg-green-500' : checksPassed >= 3 ? 'bg-yellow-500' : 'bg-red-500'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirm) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await account.updatePassword(newPassword, oldPassword)
      setSuccess('Password changed successfully.')
      setOldPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(getSafeAuthError(err, 'Could not update password. Please try again.'))
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
          Back to dashboard
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">Change Password</h2>
        <p className="mt-2 text-center text-sm font-normal text-indigo-400">
          Logged in as <span className="font-semibold text-white">{user?.email}</span>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
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
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-100">
              Current password
            </label>
            <div className="mt-2">
              <input
                id="oldPassword"
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="********"
              />
              <button type="button" onClick={() => setShowOld((v) => !v)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                {showOld ? 'Hide current password' : 'Show current password'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-100">
              New password
            </label>
            <div className="mt-2">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                minLength={8}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="********"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                {showNew ? 'Hide new password' : 'Show new password'}
              </button>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Password strength</span>
                <span>{strengthLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${strengthColor}`} style={{ width: `${(checksPassed / 5) * 100}%` }} />
              </div>
              <ul className="mt-3 text-xs text-gray-400 space-y-1">
                <li className={hasMinLength ? 'text-green-400' : ''}>At least 8 characters</li>
                <li className={hasUpper ? 'text-green-400' : ''}>One uppercase letter</li>
                <li className={hasLower ? 'text-green-400' : ''}>One lowercase letter</li>
                <li className={hasDigit ? 'text-green-400' : ''}>One number</li>
                <li className={hasSymbol ? 'text-green-400' : ''}>One special character</li>
              </ul>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-100">
              Confirm new password
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                placeholder="********"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                {showConfirm ? 'Hide confirmation' : 'Show confirmation'}
              </button>
              {confirm && (
                <p className={`mt-2 text-xs ${confirm === newPassword ? 'text-green-400' : 'text-red-400'}`}>
                  {confirm === newPassword ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
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
