interface Props {
  message: string
}

export function ErrorMessage({ message }: Props) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  )
}

export function EmptyState({ message }: Props) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-4 py-10 text-center text-sm text-ink-muted">
      {message}
    </div>
  )
}
