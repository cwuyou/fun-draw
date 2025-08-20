import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create List - Random Picker List Creator | Pick One',
  description: 'Create custom lists for random picker and name picker activities. Easy list creator for classroom picker, team picker, corporate lottery, and party picker events. Free online list management tool for interactive drawing activities.',
  keywords: 'create list, random picker, name picker, list creator, classroom picker, team picker, corporate lottery, party picker, drawing tool, list management',
  openGraph: {
    title: 'Create List - Random Picker List Creator',
    description: 'Create custom lists for random picker and name picker activities. Easy list creator for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create List - Random Picker List Creator',
    description: 'Create custom lists for random picker and name picker activities.',
  }
}

export default function CreateListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
