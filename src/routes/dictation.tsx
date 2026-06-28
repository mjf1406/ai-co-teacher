import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dictation')({
  beforeLoad: () => {
    throw redirect({
      to: '/vocabulary',
      search: { worksheet: 'dictation-audio' },
    })
  },
})
