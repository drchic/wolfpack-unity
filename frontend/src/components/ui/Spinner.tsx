export function Spinner() {
  return (
    <div role="status" aria-label="Loading" className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-edge border-t-accent" />
    </div>
  )
}
