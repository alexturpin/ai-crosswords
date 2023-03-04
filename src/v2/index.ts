import { generatePuzzle } from "./crossword"
import { readFileSync } from "fs"

const words = readFileSync("src/words.txt", "utf-8")
  .split("\n")
  .filter((word) => word.length === 5)
console.log(`Loaded ${words.length} words`)

generatePuzzle({ width: 5, height: 5 }, words)
