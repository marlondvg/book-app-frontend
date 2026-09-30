import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { login } from '../auth/auth-api.ts'
import { startSession } from '../auth/session.ts'
import { TextField } from '../components/TextField.tsx'
import { ApiError } from '../lib/api-client.ts'
import { applyApiError } from '../lib/form-errors.ts'
import './AuthPage.css'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  // GuestOnly redirects once the session starts, so there is no navigate() here.
  const onSubmit = async (values: LoginForm) => {
    try {
      const token = await login(values)
      startSession(token.accessToken, token.expiresIn)
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setError('root.server', {
          message: 'Too many failed attempts. Wait a few minutes and try again.',
        })
      } else {
        applyApiError(error, setError, ['email', 'password'])
      }
    }
  }

  return (
    <div className="auth-page">
      <h1>Log in</h1>
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        No account yet?{' '}
        <Link to="/register" state={location.state}>
          Create one
        </Link>
      </p>
    </div>
  )
}
