import clsx from 'clsx'
import {
  Activity,
  ChevronDown,
  CircleAlert,
  CircleDollarSign,
  LayoutDashboard,
  MailCheck,
  Menu,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { toast } from 'sonner'

import { useSystemStatusQuery } from '@/entities/system/model/queries'
import { useResyncSystem } from '@/features/resync-system/model/useResyncSystem'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatDateTime } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button'

const navigation = [
  {
    label: 'Заявки',
    to: '/',
    icon: LayoutDashboard,
  },
]

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)
  const systemMenuRef = useRef<HTMLDivElement>(null)
  const systemQuery = useSystemStatusQuery()
  const resyncMutation = useResyncSystem()
  const systemOnline = Boolean(
    systemQuery.data?.bybitApiAvailable && systemQuery.data?.gmailImapsAvailable,
  )

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!systemMenuRef.current?.contains(event.target as Node)) setSystemMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const resync = async () => {
    try {
      await resyncMutation.mutateAsync()
      toast.success('Система синхронизирована')
    } catch (error) {
      toast.error('Не удалось синхронизировать систему', {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <div className={clsx('app-shell', sidebarOpen && 'app-shell--sidebar-open')}>
      <aside className={clsx('sidebar', sidebarOpen && 'sidebar--open')}>
        <div className="sidebar__brand">
          <Link to="/" className="brand" aria-label="FlowPay, на главную">
            <span className="brand__mark">
              <CircleDollarSign size={23} strokeWidth={2.2} />
            </span>
            <span>
              <strong>FlowPay</strong>
              <small>Bybit P2P payouts</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Скрыть меню"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Основная навигация">
          <span className="sidebar__label">Управление</span>
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item--active')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="security-note">
            <span className="security-note__icon">
              <ShieldCheck size={17} />
            </span>
            <div>
              <strong>Локальный контур</strong>
              <span>Данные остаются в вашей сети</span>
            </div>
          </div>
          <div className="sidebar__version">FlowPay v1.0</div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <div className="app-shell__content">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Скрыть меню' : 'Открыть меню'}
          >
            <Menu size={21} />
          </button>

          <div className="topbar__spacer" />

          <div className="system-menu" ref={systemMenuRef}>
            <button
              type="button"
              className="topbar__status"
              aria-expanded={systemMenuOpen}
              onClick={() => setSystemMenuOpen((open) => !open)}
            >
              <span
                className={clsx(
                  'topbar__status-dot',
                  systemQuery.isError
                    ? 'topbar__status-dot--error'
                    : systemOnline
                      ? 'topbar__status-dot--online'
                      : 'topbar__status-dot--warning',
                )}
              />
              <span>
                {systemQuery.isError
                  ? 'Backend недоступен'
                  : systemOnline
                    ? 'Система в норме'
                    : 'Проверьте интеграции'}
              </span>
              <ChevronDown size={14} />
            </button>

            {systemMenuOpen && (
              <div className="system-popover">
                <div className="system-popover__header">
                  <div>
                    <strong>Доступность системы</strong>
                    <span>Обновлено {formatDateTime(systemQuery.data?.lastUpdatedAt)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    aria-label="Синхронизировать систему"
                    loading={resyncMutation.isPending}
                    onClick={() => void resync()}
                  />
                </div>
                <div className="system-popover__integration">
                  <Server size={16} />
                  <div>
                    <strong>Bybit API</strong>
                    <span>Режим {systemQuery.data?.bybitMode ?? '—'}</span>
                  </div>
                  <span
                    className={clsx(
                      'integration-state',
                      systemQuery.data?.bybitApiAvailable && 'is-online',
                    )}
                  >
                    {systemQuery.data?.bybitApiAvailable ? 'Доступен' : 'Недоступен'}
                  </span>
                </div>
                <div className="system-popover__integration">
                  <MailCheck size={16} />
                  <div>
                    <strong>Gmail IMAPS</strong>
                    <span>Получение PDF-чеков</span>
                  </div>
                  <span
                    className={clsx(
                      'integration-state',
                      systemQuery.data?.gmailImapsAvailable && 'is-online',
                    )}
                  >
                    {systemQuery.data?.gmailImapsAvailable ? 'Доступен' : 'Недоступен'}
                  </span>
                </div>
                {systemQuery.data?.lastSystemError && (
                  <div className="system-popover__error">
                    <CircleAlert size={15} />
                    <span>{systemQuery.data.lastSystemError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="profile-chip">
            <span className="profile-chip__avatar">
              <Activity size={17} />
            </span>
            <span>
              <strong>Оператор</strong>
              <small>Локальный доступ</small>
            </span>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
