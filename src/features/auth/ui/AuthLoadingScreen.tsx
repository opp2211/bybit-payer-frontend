import { CircleDollarSign } from 'lucide-react'

export function AuthLoadingScreen() {
  return (
    <main className="auth-screen" aria-label="Проверка авторизации">
      <div className="auth-loading">
        <span className="auth-brand__mark">
          <CircleDollarSign size={28} strokeWidth={2.2} />
        </span>
        <span className="auth-loading__spinner" aria-hidden="true" />
      </div>
    </main>
  )
}
