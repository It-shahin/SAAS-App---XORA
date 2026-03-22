const GENERIC_AUTH_ERROR =
  'We could not complete that request. Please check your details and try again.'

export const getSafeAuthError = (error, fallback = GENERIC_AUTH_ERROR) => {
  const code = String(error?.code || '')

  if (code.includes('user_invalid_credentials')) {
    return 'Invalid email or password.'
  }

  if (code.includes('user_already_exists')) {
    return 'An account with this email already exists.'
  }

  if (code.includes('user_password_mismatch')) {
    return 'Current password is incorrect.'
  }

  if (code.includes('general_rate_limit_exceeded')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return fallback
}

