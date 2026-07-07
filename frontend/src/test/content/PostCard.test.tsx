import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PostCard } from '../../content/PostCard'

const newsPost = {
  id: '1',
  type: 'NEWS' as const,
  title: 'Big News',
  slug: 'big-news',
  body: 'Something happened',
  youtubeUrl: null,
  authorName: 'Admin',
  publishedAt: '2026-07-07T10:00:00Z',
}

test('renders post title as a link', () => {
  render(<MemoryRouter><PostCard post={newsPost} /></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Big News' })).toHaveAttribute('href', '/posts/big-news')
})

test('renders author name', () => {
  render(<MemoryRouter><PostCard post={newsPost} /></MemoryRouter>)
  expect(screen.getByText('Admin')).toBeInTheDocument()
})

test('VLOG card renders youtube link text', () => {
  const vlog = { ...newsPost, type: 'VLOG' as const, youtubeUrl: 'https://youtu.be/abc123' }
  render(<MemoryRouter><PostCard post={vlog} /></MemoryRouter>)
  expect(screen.getByText(/watch/i)).toBeInTheDocument()
})
