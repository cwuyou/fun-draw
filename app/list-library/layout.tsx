import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Library - Manage Random Picker Lists | Pick One',
  description: 'Manage and organize your random picker and name picker lists. List library for classroom picker, team picker, corporate lottery, and party picker activities. Free online list management and organization tool.',
  keywords: 'list library, random picker, name picker, list management, classroom picker, team picker, corporate lottery, party picker, drawing tool, list organization',
  openGraph: {
    title: 'List Library - Manage Random Picker Lists',
    description: 'Manage and organize your random picker and name picker lists. List library for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List Library - Manage Random Picker Lists',
    description: 'Manage and organize your random picker and name picker lists.',
  }
}

export default function ListLibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
