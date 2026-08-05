import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersTable } from './UsersTable'
import { ReservationsTable } from './ReservationsTable'
import { StatsView } from './StatsView'
import { PostsTable } from './PostsTable'
import { TopNav } from '../components/TopNav'
import { Button, PageHeader } from '../components/ui'

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'stats', label: 'Stats' },
  { key: 'content', label: 'Content' },
] as const

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['key']>('users')

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="Admin Panel" />
          <Link to="/">
            <Button variant="ghost">Back to App</Button>
          </Link>
        </div>

        <div className="mb-6 flex gap-6 border-b border-edge">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'reservations' && <ReservationsTable />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'content' && <PostsTable />}
        </div>
      </div>
    </>
  )
}
