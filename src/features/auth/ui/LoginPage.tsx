import { CircleDollarSign, KeyRound, LockKeyhole, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAuth } from '@/features/auth/model/useAuth'
import { ApiError } from '@/shared/api/api-client'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/Button'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(username.trim(), password)
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
            <h1>Вход в панель</h1>
            <p>Авторизуйтесь для управления выплатами.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label className="login-field">
            <span>Логин</span>
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

          <label className="login-field">
            <span>Пароль</span>
            <span className="login-field__control">
              <LockKeyhole size={17} />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
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
            Войти
          </Button>
        </form>

        <p className="login-card__note">
          Этот браузер останется авторизованным, пока вы не нажмёте «Выйти».
        </p>
      </section>
    </main>
  )
}
