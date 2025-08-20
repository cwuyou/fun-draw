import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grid Lottery Picker - Professional Winner Picker Tool | Pick One',
  description: 'Professional grid lottery picker with TV show style animations for ceremonial random selection. Perfect winner picker for classroom activities, team picker events, and corporate lottery. Free online grid lottery picker tool with exciting drawing experience.',
  keywords: 'grid lottery, lottery picker, random picker, interactive picker, animated picker, drawing tool, classroom picker, team picker, corporate lottery, winner picker, fun drawing tool',
  openGraph: {
    title: 'Grid Lottery Picker - Professional Winner Picker Tool',
    description: 'Professional grid lottery picker with TV show style animations for ceremonial random selection. Perfect for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grid Lottery Picker - Professional Winner Picker Tool',
    description: 'Professional grid lottery picker with TV show style animations for ceremonial random selection.',
  }
}

export default function GridLotteryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
