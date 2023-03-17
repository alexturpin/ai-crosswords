import { fillCrossword, Grid } from "./crossword"
import { readFileSync } from "fs"

for (let i = 0; i < 10; i++) console.log("")

const words = readFileSync("src/5words.txt", "utf-8")
  .split("\n")
  .filter((word) => word.length === 5)
  .map((word) => word.toUpperCase())
console.log(`Loaded ${words.length} words`)

const getWords = (grid: Grid) => {
  const words: string[] = []
  for (let i = 0; i < 5; i++) {
    words.push(grid[i].join(""))
    words.push(grid.map((row) => row[i]).join(""))
  }
  return words
}

const printGrid = (grid: Grid): string => {
  let result = ""
  for (const row of grid) {
    result += row.join("") + "\n"
  }
  return result
}

const crossword = fillCrossword(words)
if (crossword) {
  console.log(getWords(crossword).join("\n"))
  console.log("\n" + printGrid(crossword))
} else {
  console.log("No solution found.")
}
