import { generatePuzzle } from "./crossword"
import { readFileSync } from "fs"

for (let i = 0; i < 10; i++) console.log("")

const words = readFileSync("src/wordlist.txt", "utf-8")
  .split("\n")
  .filter((word) => word.length === 5)
console.log(`Loaded ${words.length} words`)

generatePuzzle({ width: 5, height: 5 }, words)
