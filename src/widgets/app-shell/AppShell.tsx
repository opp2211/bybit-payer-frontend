import clsx from 'clsx'
import {
  Activity,
  Building2,
  ChevronDown,
  CircleAlert,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  RefreshCw,
  Server,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { toast } from 'sonner'

import { useSystemStatusQuery } from '@/entities/system/model/queries'
import { useAuth } from '@/features/auth/model/useAuth'
import { useResyncSystem } from '@/features/resync-system/model/useResyncSystem'
import { useWorkspace } from '@/features/workspace/model/useWorkspace'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatDateTime } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button'

export function AppShell() {
  const { user, logout } = useAuth()
  const { workspaces, selectedWorkspace, selectedWorkspaceId, selectWorkspace } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const systemMenuRef = useRef<HTMLDivElement>(null)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)
  const systemQuery = useSystemStatusQuery(selectedWorkspaceId ?? undefined)
  const resyncMutation = useResyncSystem(selectedWorkspaceId ?? '')
  const systemOnline = Boolean(
    systemQuery.data?.bybitApiAvailable && systemQuery.data?.gmailImapsAvailable,
  )
  const simulatorAvailable = systemQuery.data?.bybitMode === 'FAKE'

  const navigation = [
    {
      label: 'Заявки',
      to: '/',
      icon: LayoutDashboard,
      end: true,
    },
    ...(simulatorAvailable
      ? [
          {
            label: 'P2P-симулятор',
            to: '/p2p-simulator',
            icon: Store,
          },
        ]
      : []),
    {
      label: 'Рабочие пространства',
      to: '/workspaces',
      icon: Users,
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            label: 'Админка',
            to: '/admin/banks',
            icon: Building2,
          },
        ]
      : []),
  ]

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!systemMenuRef.current?.contains(event.target as Node)) setSystemMenuOpen(false)
      if (!workspaceMenuRef.current?.contains(event.target as Node)) setWorkspaceMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [])

  const resync = async () => {
    if (!selectedWorkspaceId) return

    try {
      await resyncMutation.mutateAsync()
      toast.success('Система синхронизирована')
    } catch (error) {
      toast.error('Не удалось синхронизировать систему', {
        description: getErrorMessage(error),
      })
    }
  }

  const logOut = async () => {
    try {
      await logout()
    } catch (error) {
      toast.error('Не удалось выйти', {
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
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
              <strong>Защищённый доступ</strong>
              <span>Рабочие действия доступны участникам пространства</span>
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

          <div className="workspace-menu" ref={workspaceMenuRef}>
            <button
              type="button"
              className="workspace-switcher"
              aria-expanded={workspaceMenuOpen}
              onClick={() => setWorkspaceMenuOpen((open) => !open)}
            >
              <Users size={16} />
              <span>
                <strong>{selectedWorkspace?.name ?? 'Нет workspace'}</strong>
                <small>{selectedWorkspace?.publicId ?? 'Создайте пространство'}</small>
              </span>
              <ChevronDown size={14} />
            </button>

            {workspaceMenuOpen && (
              <div className="workspace-popover">
                {workspaces.length === 0 ? (
                  <Link
                    className="workspace-popover__empty"
                    to="/workspaces"
                    onClick={() => setWorkspaceMenuOpen(false)}
                  >
                    Создать рабочее пространство
                  </Link>
                ) : (
                  workspaces.map((workspace) => (
                    <button
                      key={workspace.publicId}
                      type="button"
                      className={clsx(
                        'workspace-option',
                        workspace.publicId === selectedWorkspaceId && 'is-active',
                      )}
                      onClick={() => {
                        selectWorkspace(workspace.publicId)
                        setWorkspaceMenuOpen(false)
                      }}
                    >
                      <span>
                        <strong>{workspace.name}</strong>
                        <small>{workspace.publicId}</small>
                      </span>
                      <small>
                        {workspace.currentUserRole === 'OWNER' ? 'Владелец' : 'Участник'}
                      </small>
                    </button>
                  ))
                )}
                <Link
                  className="workspace-popover__manage"
                  to="/workspaces"
                  onClick={() => setWorkspaceMenuOpen(false)}
                >
                  Управление workspace
                </Link>
              </div>
            )}
          </div>

          <div className="topbar__spacer" />

          <div className="system-menu" ref={systemMenuRef}>
            <button
              type="button"
              className="topbar__status"
              aria-expanded={systemMenuOpen}
              disabled={!selectedWorkspaceId}
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
                {!selectedWorkspaceId
                  ? 'Нет workspace'
                  : systemQuery.isError
                    ? 'Backend недоступен'
                    : systemOnline
                      ? 'Система в норме'
                      : 'Проверьте интеграции'}
              </span>
              <ChevronDown size={14} />
            </button>

            {systemMenuOpen && selectedWorkspaceId && (
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
                    <span>Режим {systemQuery.data?.bybitMode ?? '-'}</span>
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
                    <strong>IMAP</strong>
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
              <strong>{user?.username ?? 'Оператор'}</strong>
              <small>{user?.role === 'ADMIN' ? 'Админ' : 'Пользователь'}</small>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={16} />}
            aria-label="Выйти"
            title="Выйти"
            onClick={() => void logOut()}
          />
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
