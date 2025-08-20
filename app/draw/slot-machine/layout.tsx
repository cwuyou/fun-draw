import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Slot Machine Picker - Interactive Random Picker Tool | Pick One',
  description: 'Professional slot machine picker with animated reels for exciting random selection. Perfect interactive picker for classroom activities, team picker events, and corporate lottery. Free online slot machine picker tool with thrilling drawing experience.',
  keywords: 'slot machine picker, random picker, interactive picker, animated picker, drawing tool, classroom picker, team picker, corporate lottery, winner picker, fun drawing tool',
  openGraph: {
    title: 'Slot Machine Picker - Interactive Random Picker Tool',
    description: 'Professional slot machine picker with animated reels for exciting random selection. Perfect for classroom and team activities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slot Machine Picker - Interactive Random Picker Tool',
    description: 'Professional slot machine picker with animated reels for exciting random selection.',
  }
}

export default function SlotMachineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
