import { render, screen } from '@testing-library/react'
import { Button, Badge, Card, ErrorMessage, EmptyState } from '../../components/ui'

test('Button renders its label', () => {
  render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})

test('Badge renders the post type text', () => {
  render(<Badge type="VLOG" />)
  expect(screen.getByText('VLOG')).toBeInTheDocument()
})

test('Card renders children', () => {
  render(<Card>content</Card>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

test('ErrorMessage renders the message text', () => {
  render(<ErrorMessage message="Something broke" />)
  expect(screen.getByText('Something broke')).toBeInTheDocument()
})

test('EmptyState renders the message text', () => {
  render(<EmptyState message="Nothing here" />)
  expect(screen.getByText('Nothing here')).toBeInTheDocument()
})
