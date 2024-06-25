import type { Trie } from "./answers/trie"

export type Grid = string[][]

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const fillCrossword = (
  trie: Trie,
  width: number,
  height: number
): Grid | null => {
  const emptyGrid = Array.from({ length: height }, () => Array(width).fill(""))

  const findSolution = (
    grid: Grid,
    row: number,
    col: number,
    usedWords: Set<string>
  ): Grid | null => {
    if (row === height) return grid

    const nextRow = col === width - 1 ? row + 1 : row
    const nextCol = col === width - 1 ? 0 : col + 1

    if (grid[row][col] !== "")
      return findSolution(grid, nextRow, nextCol, usedWords)

    const getValidCharsForRow = (r: number): Set<string> => {
      let currentNodeForRow = trie[width]
      for (let i = 0; i < col; i++)
        currentNodeForRow = currentNodeForRow[grid[r][i]] || {}

      return new Set(Object.keys(currentNodeForRow))
    }

    const getValidCharsForCol = (c: number): Set<string> => {
      let currentNodeForCol = trie[height]
      for (let i = 0; i < row; i++)
        currentNodeForCol = currentNodeForCol[grid[i][c]] || {}

      return new Set(Object.keys(currentNodeForCol))
    }

    const validCharsForRow = getValidCharsForRow(row)
    const validCharsForCol = getValidCharsForCol(col)
    const validChars = shuffleArray(
      [...validCharsForRow].filter((char) => validCharsForCol.has(char))
    )

    for (const c of validChars) {
      const newRow = grid.map((r, i) =>
        i === row ? r.slice(0, col).concat(c, r.slice(col + 1)) : r
      )

      if (col === width - 1 || row === height - 1) {
        const currentRow = newRow[row].join("")
        const currentCol = newRow.map((r) => r[col]).join("")

        // Check for duplicates in the row and column
        if (usedWords.has(currentRow) || usedWords.has(currentCol)) continue

        usedWords.add(currentRow)
        usedWords.add(currentCol)
      }

      const solution = findSolution(newRow, nextRow, nextCol, usedWords)
      if (solution) return solution

      if (col === width - 1 || row === height - 1) {
        const currentRow = newRow[row].join("")
        const currentCol = newRow.map((r) => r[col]).join("")
        usedWords.delete(currentRow)
        usedWords.delete(currentCol)
      }
    }

    return null
  }

  return findSolution(emptyGrid, 0, 0, new Set())
}
