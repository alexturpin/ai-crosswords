import { and, countDistinct, eq, like, lt, or, sql } from "drizzle-orm"
import { getPlatformProxy } from "wrangler"
import { makeDB } from "./db/db"
import { answers } from "./db/schema"
import { grids } from "./grids"
type Grid = string[][]
type Position = [number, number] // [row, col]

const makeGrid = (gridPattern: string): Grid =>
  gridPattern.split("\n").map((row) => row.split(""))

function getWord(
  grid: Grid,
  start: Position,
  direction: "across" | "down",
): string {
  let word = ""
  let [row, col] = start
  while (row < grid.length && col < grid[0].length && grid[row][col] !== "#") {
    word += grid[row][col]
    if (direction === "across") col++
    else row++
  }
  return word
}

function setWord(
  grid: Grid,
  word: string,
  start: Position,
  direction: "across" | "down",
): void {
  let [row, col] = start
  for (let char of word) {
    if (row >= grid.length || col >= grid[0].length || grid[row][col] === "#")
      break
    grid[row][col] = char
    if (direction === "across") col++
    else row++
  }
}

async function fillSubgrid(grid: Grid, start: Position): Promise<boolean> {
  const [row, col] = start
  if (row >= grid.length || col >= grid[0].length || grid[row][col] === "#")
    return true

  const acrossPattern = getWord(grid, start, "across").replace(/_/g, ".")
  const downPattern = getWord(grid, start, "down").replace(/_/g, ".")

  const acrossWords = await getPossibleAnswers(acrossPattern)
  const downWords = await getPossibleAnswers(downPattern)

  for (const acrossWord of acrossWords) {
    setWord(grid, acrossWord, start, "across")

    for (const downWord of downWords) {
      if (downWord[0] !== acrossWord[0]) continue

      setWord(grid, downWord, start, "down")

      if (
        (await fillSubgrid(grid, [row, col + 1])) &&
        (await fillSubgrid(grid, [row + 1, col]))
      ) {
        return true
      }

      // Backtrack
      setWord(grid, "_".repeat(downWord.length), start, "down")
    }

    // Backtrack
    setWord(grid, "_".repeat(acrossWord.length), start, "across")
  }

  return false
}

export async function fillCrossword(gridPattern: string): Promise<Grid | null> {
  const grid = makeGrid(gridPattern)

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col] === "_" && !(await fillSubgrid(grid, [row, col]))) {
        return null // Failed to fill the crossword
      }
    }
  }

  return grid
}

const platform = await getPlatformProxy<Env>()
const db = await makeDB(platform.env.DB)

const isEmptyPattern = (pattern: string) =>
  pattern === "_".repeat(pattern.length)

const getPossibleAnswers = async (pattern: string) => {
  const result = await db
    .select({ answer: answers.answer })
    .from(answers)
    .where(
      and(
        !isEmptyPattern(pattern) ? like(answers.answer, pattern) : undefined,
        sql`length(${answers.answer}) = ${pattern.length}`,
        lt(answers.rating, 5),
      ),
    )
    .orderBy(
      sql`(5 - ${answers.rating}) * (abs(random()) / 9223372036854775807.0) desc`,
    )
    .limit(100)
    .then((rows) => rows.map((row) => row.answer))

  return result
}

// console.log(await getAnswer("____"))

const crossword = await fillCrossword(grids[7])

console.log(crossword)

platform.dispose()
