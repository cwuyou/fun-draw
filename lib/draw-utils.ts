import type { ListItem, DrawingConfig } from "@/types"

export interface DrawResult {
  winners: ListItem[]
  timestamp: string
  mode: string
  totalItems: number
}

export function performDraw(config: DrawingConfig): ListItem[] {
  const { items, quantity, allowRepeat } = config
  const winners: ListItem[] = []
  const availableItems = [...items]

  for (let i = 0; i < quantity; i++) {
    if (availableItems.length === 0) break

    const randomIndex = Math.floor(Math.random() * availableItems.length)
    const winner = availableItems[randomIndex]
    winners.push(winner)

    if (!allowRepeat) {
      availableItems.splice(randomIndex, 1)
    }
  }

  return winners
}

export function exportResults(results: DrawResult): void {
  const content = [
    `抽奖结果 - ${new Date(results.timestamp).toLocaleString("zh-CN")}`,
    `抽奖模式: ${results.mode}`,
    `总项目数: ${results.totalItems}`,
    `中奖项目: ${results.winners.length}`,
    "",
    "中奖名单:",
    ...results.winners.map((winner, index) => `${index + 1}. ${winner.name}`),
  ].join("\n")

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `抽奖结果_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}
