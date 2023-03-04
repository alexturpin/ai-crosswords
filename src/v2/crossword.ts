type Direction = "across" | "down"

type Grid = {
  width: number
  height: number
}

type Position = {
  x: number
  y: number
  direction: Direction
  length: number
}

type PossibleMove = Position & { played: boolean }

type Move = Position & { word: string }

type Puzzle = Grid & { letters: string[][] }

export const computePuzzle = (grid: Grid, moves: Move[]): Puzzle | null => {
  const letters: Puzzle["letters"] = Array.from({ length: grid.width }, () =>
    Array.from({ length: grid.height }, () => " ")
  )

  for (const move of moves) {
    for (let i = 0; i < move.length; i++) {
      const x = move.direction === "across" ? move.x + i : move.x
      const y = move.direction === "down" ? move.y + i : move.y
      const letter = move.word[i]

      if (letters[x][y] !== " " && letters[x][y] !== letter) return null

      letters[x][y] = letter
    }
  }

  return { ...grid, letters }
}

export const findPositions = (grid: Grid) => {
  const positions: PossibleMove[] = []

  for (let x = 0; x < grid.width; x++)
    positions.push({
      x,
      y: 0,
      direction: "down",
      length: grid.height,
      played: false,
    })

  for (let y = 0; y < grid.height; y++)
    positions.push({
      x: 0,
      y,
      direction: "across",
      length: grid.width,
      played: false,
    })

  return positions
}

export const find = () => {}

export const displayPuzzle = (puzzle: Puzzle) =>
  puzzle.letters
    .map((row) => row.map((l) => l.toUpperCase()).join(""))
    .join("\n")

export const generatePuzzle = (grid: Grid, words: string[]) => {
  const moves: Move[] = []
  const possibleMoves = findPositions(grid)

  let puzzle: Puzzle | null = null
  while (true) {
    puzzle = computePuzzle(grid, moves)

    if (!puzzle) {
      moves.pop()
      continue
    }

    if (moves.length === 2) break

    let tries = 0
    while (true) {
      if (tries++ > 1000) {
        moves.pop()
        break
      }

      const remainingPossibleMoves = possibleMoves.filter(
        (move) => !move.played
      )
      const move =
        remainingPossibleMoves[
          Math.floor(Math.random() * remainingPossibleMoves.length)
        ]

      moves.push({
        ...move,
        word: words[Math.floor(Math.random() * words.length)],
      })
    }
  }

  console.log(displayPuzzle(puzzle))
}
