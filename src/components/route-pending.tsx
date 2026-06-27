export function RoutePending() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <img
        src="/brand/ai-co-teacher%20logo%20500x500.webp"
        alt=""
        className="size-20 animate-spin"
        aria-hidden
      />
    </div>
  )
}
