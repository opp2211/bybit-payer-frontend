import clsx from 'clsx'
import {
  Activity,
  Bell,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { useSystemStatusQuery } from '@/entities/system/model/queries'

const navigation = [
  {
    label: 'Рабочая панель',
    to: '/',
    icon: LayoutDashboard,
  },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const systemQuery = useSystemStatusQuery()
  const systemOnline = Boolean(
    systemQuery.data?.bybitApiAvailable && systemQuery.data?.gmailImapsAvailable,
  )

  return (
    <div className="app-shell">
      <aside className={clsx('sidebar', mobileOpen && 'sidebar--open')}>
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
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
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
              onClick={() => setMobileOpen(false)}
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

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <div className="app-shell__content">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu size={21} />
          </button>

          <div className="topbar__spacer" />

          <div className="topbar__status" title="Состояние интеграций">
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
          </div>

          <button type="button" className="topbar__icon-button" aria-label="Уведомления">
            <Bell size={19} />
          </button>

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
