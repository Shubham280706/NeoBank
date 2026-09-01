import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] text-center">
      <p className="text-6xl font-bold text-[var(--color-primary)]">404</p>
      <p className="text-[var(--color-text-muted)]">This page doesn&apos;t exist.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  )
}
