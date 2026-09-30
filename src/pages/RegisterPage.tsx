import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { login, register as registerAccount } from '../auth/auth-api.ts'
import { startSession } from '../auth/session.ts'
import { TextField } from '../components/TextField.tsx'
import { ApiError } from '../lib/api-client.ts'
import { applyApiError, describeError } from '../lib/form-errors.ts'
import './AuthPage.css'

// Mirrors RegisterRequest and PasswordPolicy in book-api.
const schema = z
  .object({
    email: z.email('Enter a valid email').max(255, 'Email is too long'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      // BCrypt ignores anything after 72 bytes, so the API rejects longer passwords.
      .refine((value) => new TextEncoder().encode(value).length <= 72, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof schema>

export function RegisterPage() {
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: RegisterForm) => {
    try {
      await registerAccount({ email, password })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: 'An account with this email already exists' })
      } else {
        applyApiError(error, setError, ['email', 'password'])
      }
      return
    }

    // Registering does not log in; do it now so the user lands in the app.
    try {
      const token = await login({ email, password })
      startSession(token.accessToken, token.expiresIn)
    } catch (error) {
      setError('root.server', {
        message: `Your account was created, but logging in failed: ${describeError(error)}`,
      })
    }
  }

  return (
    <div className="auth-page">
      <h1>Create an account</h1>
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root?.server && (
          <p role="alert" className="form-error">
            {errors.root.server.message}
          </p>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <Link to="/login" state={location.state}>
          Log in
        </Link>
      </p>
    </div>
  )
}
