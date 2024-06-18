import { fillCrossword, type Grid } from "./crossword"
import trie from "./words/trie.json"
import type { Trie } from "./trie"
import ratings from "./words/ratings.json"

const getWords = (grid: Grid) => {
  const words: string[] = []

  for (let i = 0; i < 5; i++) {
    words.push(grid[i].join(""))
    words.push(grid.map((row) => row[i]).join(""))
  }

  return words.map((word) => ({
    word,
    rating: ratings[word as keyof typeof ratings] ?? 2,
  }))
}

const printGrid = (grid: Grid): string => {
  let result = ""
  for (const row of grid) {
    result += row.join("") + "\n"
  }
  return result
}

const getDifficultyRating = (words: ReturnType<typeof getWords>) => {
  const multipliers: Record<number, number> = { 4: 10 }
  return words.reduce((acc, { word, rating }) => {
    const multiplier = multipliers[word.length] ?? 1
    return acc + rating * multiplier
  }, 0)
}

const crossword = fillCrossword(trie as unknown as Trie, 5, 5)
if (crossword) {
  const words = getWords(crossword)
  console.log(words.map(({ word, rating }) => `${word} ${rating}`).join("\n"))
  console.log("\n" + printGrid(crossword))
  console.log("Difficulty rating:", getDifficultyRating(words))
} else {
  console.log("No solution found.")
}
