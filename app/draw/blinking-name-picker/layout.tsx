import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blinking Name Picker - Student Name Picker for Teachers | Pick One',
  description: 'Professional blinking name picker for classroom and team activities. Perfect student name picker for teachers, classroom picker for interactive learning, and team picker for group activities. Free online blinking name picker tool with highlight effects.',
  keywords: 'blinking name picker, student name picker, classroom picker, teacher random picker, name picker, interactive picker, animated picker, drawing tool, team picker, group selector',
  openGraph: {
    title: 'Blinking Name Picker - Student Name Picker for Teachers',
    description: 'Professional blinking name picker for classroom and team activities. Perfect student name picker for teachers and interactive learning.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blinking Name Picker - Student Name Picker for Teachers',
    description: 'Professional blinking name picker for classroom and team activities. Perfect student name picker for teachers.',
  }
}

export default function BlinkingNamePickerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
