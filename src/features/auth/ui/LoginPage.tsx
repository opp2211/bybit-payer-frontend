import { CircleDollarSign, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { authApi } from '@/features/auth/api/auth-api'
import { useAuth } from '@/features/auth/model/useAuth'
import { ApiError } from '@/shared/api/api-client'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/Button'

type AuthMode = 'login' | 'register'

export function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (mode === 'register') {
        if (password.length < 8) {
          setError('Пароль должен быть не короче 8 символов.')
          return
        }
        await authApi.register({
          username: username.trim(),
          email: email.trim(),
          password,
        })
        await login(email.trim(), password)
      } else {
        await login(username.trim(), password)
      }
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.status === 401) {
        setError('Неверный логин или пароль.')
      } else if (loginError instanceof ApiError && loginError.status === 429) {
        setError('Слишком много попыток входа. Подождите несколько минут.')
      } else {
        setError(getErrorMessage(loginError))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="login-card">
        <div className="auth-brand">
          <span className="auth-brand__mark">
            <CircleDollarSign size={25} strokeWidth={2.2} />
          </span>
          <span>
            <strong>FlowPay</strong>
            <small>Bybit P2P payouts</small>
          </span>
        </div>

        <div className="login-card__heading">
          <span className="login-card__icon">
            <KeyRound size={21} />
          </span>
          <div>
            <h1>{mode === 'login' ? 'Вход в панель' : 'Регистрация'}</h1>
            <p>
              {mode === 'login'
                ? 'Войдите по username или email.'
                : 'Создайте пользователя и добавьте рабочее пространство.'}
            </p>
          </div>
        </div>

        <div className="auth-mode-switch" role="tablist" aria-label="Режим авторизации">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : undefined}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : undefined}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Регистрация
          </button>
        </div>

        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label className="login-field">
            <span>{mode === 'login' ? 'Username или email' : 'Username'}</span>
            <span className="login-field__control">
              <UserRound size={17} />
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </span>
          </label>

          {mode === 'register' && (
            <label className="login-field">
              <span>Email</span>
              <span className="login-field__control">
                <Mail size={17} />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>
          )}

          <label className="login-field">
            <span>Пароль</span>
            <span className="login-field__control">
              <LockKeyhole size={17} />
              <input
                type="password"
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>

          {error && (
            <div className="login-form__error" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={submitting}>
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="login-card__note">
          Email подтверждение уже заложено в профиле, но вход пока не блокируется.
        </p>
      </section>
    </main>
  )
}
