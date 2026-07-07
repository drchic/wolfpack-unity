import { render, screen, fireEvent } from '@testing-library/react'
import { PostForm } from '../../admin/PostForm'
import { vi } from 'vitest'

const noop = vi.fn()

test('YouTube URL field is hidden when type is not VLOG', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  expect(screen.queryByLabelText(/youtube/i)).not.toBeInTheDocument()
})

test('YouTube URL field is shown when type is VLOG', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'VLOG' } })
  expect(screen.getByLabelText(/youtube/i)).toBeInTheDocument()
})

test('submit calls onSave with form values', () => {
  render(<PostForm onSave={noop} onCancel={noop} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'NEWS' } })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Post' } })
  fireEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(noop).toHaveBeenCalledWith(expect.objectContaining({ type: 'NEWS', title: 'My Post' }))
})
