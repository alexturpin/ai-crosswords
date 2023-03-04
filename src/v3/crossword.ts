type Direction = "across" | "down"

type Grid = {
  width: number
  height: number
}

type Position = {
  n: number
  direction: Direction
}

type PossibleMove = Position & { possibleWords: string[] }

type Move = Position & { word: string }

class Puzzle {
  static MAGIC_LENGTH = 5 // also all the 0s probably

  grid: Grid
  letters: string[][]

  constructor(grid: Grid, letters: string[][]) {
    this.grid = grid
    this.letters = letters
  }

  at(x: number, y: number) {
    return this.letters[x][y]
  }

  slice(n: number, direction: Direction) {
    return Array.from(Array(Puzzle.MAGIC_LENGTH).keys())
      .map((i) => (direction === "down" ? this.at(n, i) : this.at(i, n)))
      .join("")
  }

  isComplete() {
    return this.letters.every((row) => row.every((letter) => letter !== " "))
  }

  isValid(words: string[]) {
    for (let x = 0; x < this.grid.width; x++) {
      const constraint = getWordConstraint(this.slice(x, "down"))
      if (!words.some((word) => constraint.test(word))) return false
    }

    for (let y = 0; y < this.grid.height; y++) {
      const constraint = getWordConstraint(this.slice(y, "across"))
      if (!words.some((word) => constraint.test(word))) return false
    }

    return true
  }

  toString() {
    return Array.from(Array(this.grid.height).keys())
      .map((y) =>
        Array.from(Array(this.grid.width).keys())
          .map((x) => this.at(x, y).toUpperCase())
          .join("")
      )
      .join("\n")
  }

  static from(grid: Grid, moves: Move[]) {
    const letters: Puzzle["letters"] = Array.from({ length: grid.width }, () =>
      Array.from({ length: grid.height }, () => " ")
    )

    for (const move of moves) {
      for (let i = 0; i < Puzzle.MAGIC_LENGTH; i++) {
        const x = move.direction === "across" ? i : move.n
        const y = move.direction === "across" ? move.n : i
        const letter = move.word[i]

        if (letters[x][y] !== " " && letters[x][y] !== letter)
          throw new Error("Invalid move")

        letters[x][y] = letter
      }
    }

    return new Puzzle(grid, letters)
  }
}

const getWordConstraint = (existing: string) =>
  new RegExp(
    `^${existing
      .split("")
      .map((s) => (s === " " ? "." : `[${s}]`))
      .join("")}$`
  )

const getTheoreticalPossibleMoves = (
  grid: Grid,
  puzzle: Puzzle,
  words: string[]
) => {
  const positions: PossibleMove[] = []

  for (let x = 0; x < grid.width; x++) {
    if (puzzle.at(x, 0) !== " ") continue

    const possibleWords = words.filter((word) =>
      getWordConstraint(puzzle.slice(x, "down")).test(word)
    )

    if (possibleWords.length === 0) continue

    positions.push({
      n: x,
      direction: "down",
      possibleWords,
    })
  }

  for (let y = 0; y < grid.height; y++) {
    if (puzzle.at(0, y) !== " ") continue

    const possibleWords = words.filter((word) =>
      getWordConstraint(puzzle.slice(y, "across")).test(word)
    )

    if (possibleWords.length === 0) continue

    positions.push({
      n: y,
      direction: "across",
      possibleWords,
    })
  }

  return positions
}

/*
  const themeWords: Set<string> = new Set()

  const possibleThemeWords = possibleWords.filter((word) =>
    themeWords.has(word)
  )

  if (possibleThemeWords.length > 0) {
    const randomWord =
      possibleThemeWords[Math.floor(Math.random() * possibleThemeWords.length)]

    return {
      ...randomMove,
      word: randomWord,
    }
  }
*/

const getPossibleMoves = (
  theoreticalPossibleMoves: PossibleMove[],
  prohibitedMoves: Move[]
) => {
  const possibleMoves: Move[] = []

  for (const theoreticalMove of theoreticalPossibleMoves) {
    for (const word of theoreticalMove.possibleWords) {
      if (
        prohibitedMoves.some(
          (move) =>
            move.n === theoreticalMove.n &&
            move.direction === theoreticalMove.direction &&
            move.word === word
        )
      )
        continue

      const { possibleWords: _, ...possibleMove } = theoreticalMove

      possibleMoves.push({
        ...possibleMove,
        word,
      })
    }
  }

  return possibleMoves
}

// TODO: don't pick the same word twice

export const generatePuzzle = (
  grid: Grid,
  words: string[],
  maxIterations = 2
) => {
  const moves: Move[] = []
  const iterations: Record<number, number> = []
  const prohibitedMoves: Move[] = []

  let puzzle = Puzzle.from(grid, moves)
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    iterations[moves.length] = (iterations[moves.length] ?? 0) + 1
    console.log(
      `iteration ${iteration}, move: ${moves.length}, iterations at move: ${
        iterations[moves.length]
      }`
    )

    if (iterations[moves.length] > 10) {
      delete iterations[moves.length]
      prohibitedMoves.push(moves.pop() as Move) // backtrace
      puzzle = Puzzle.from(grid, moves)

      console.log("too many iterations at move! backtracing")
      console.log(puzzle.toString())

      continue
    }

    const theoreticalPossibleMoves = getTheoreticalPossibleMoves(
      grid,
      puzzle,
      words
    )

    if (theoreticalPossibleMoves.length === 0) {
      delete iterations[moves.length]
      prohibitedMoves.push(moves.pop() as Move) // backtrace
      puzzle = Puzzle.from(grid, moves)

      console.log("no more possible moves! backtracing")
      console.log(puzzle.toString())

      continue
    }

    const possibleMoves = getPossibleMoves(
      theoreticalPossibleMoves,
      prohibitedMoves
    ).filter(
      (move) =>
        moves.length > 1 ||
        // always start with a cross, ensures constraints from the start
        (moves.length === 0 && move.direction === "across") ||
        (moves.length === 1 && move.direction === "down")
    )

    const maxTries = possibleMoves.length
    let nextMove: Move | null = null
    let nextPuzzle: Puzzle | null = null
    while (possibleMoves.length) {
      const tryMove = possibleMoves.splice(
        Math.floor(Math.random() * possibleMoves.length),
        1
      )[0]
      const tryPuzzle = Puzzle.from(grid, [...moves, tryMove])
      const valid = tryPuzzle.isValid(words)

      if (valid) {
        nextMove = tryMove
        nextPuzzle = tryPuzzle
        break
      }
    }

    if (!nextMove || !nextPuzzle) {
      delete iterations[moves.length]
      prohibitedMoves.push(moves.pop() as Move) // backtrace#
      puzzle = Puzzle.from(grid, moves)

      console.log(`no valid moves found after ${maxTries} tries! backtracing`)
      console.log(puzzle.toString())

      continue
    }

    moves.push(nextMove)
    puzzle = nextPuzzle

    console.log(nextMove)
    console.log(puzzle.toString())

    if (puzzle.isComplete()) {
      console.log(puzzle.toString())
      console.log("puzzle complete!")
      break
    }
  }
}
