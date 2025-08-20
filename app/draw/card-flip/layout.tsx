import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Card Flip Picker - Elegant Random Picker Tool | Pick One',
  description: 'Professional card flip picker with magical animations for stylish random selection. Perfect interactive picker for classroom activities, team picker events, and corporate lottery. Free online card flip picker tool with elegant drawing experience.',
  keywords: 'card flip picker, random picker, interactive picker, animated picker, drawing tool, classroom picker, team picker, corporate lottery, winner picker, fun drawing tool',
  openGraph: {
    title: 'Card Flip Picker - Elegant Random Picker Tool',
    description: 'Professional card flip picker with magical animations for stylish random selection. Perfect for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Card Flip Picker - Elegant Random Picker Tool',
    description: 'Professional card flip picker with magical animations for stylish random selection.',
  }
}

export default function CardFlipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
