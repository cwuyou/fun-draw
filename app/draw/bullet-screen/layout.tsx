import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bullet Screen Picker - Modern Random Picker Tool | Pick One',
  description: 'Professional bullet screen picker with dynamic scrolling effects for engaging random selection. Perfect interactive picker for classroom activities, team picker events, and corporate lottery. Free online bullet screen picker tool with modern drawing experience.',
  keywords: 'bullet screen picker, random picker, interactive picker, animated picker, drawing tool, classroom picker, team picker, corporate lottery, winner picker, fun drawing tool',
  openGraph: {
    title: 'Bullet Screen Picker - Modern Random Picker Tool',
    description: 'Professional bullet screen picker with dynamic scrolling effects for engaging random selection. Perfect for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bullet Screen Picker - Modern Random Picker Tool',
    description: 'Professional bullet screen picker with dynamic scrolling effects for engaging random selection.',
  }
}

export default function BulletScreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
