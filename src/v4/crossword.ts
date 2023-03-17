export type Grid = string[][]

type TrieNode = { [key: string]: TrieNode } & { isWord?: boolean }
const createTrie = (words: string[]): TrieNode => {
  const root: TrieNode = {}

  for (let w = 0; w < words.length; w++) {
    let currentNode = root
    const word = words[w]
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      if (!currentNode[char]) {
        currentNode[char] = {}
      }
      currentNode = currentNode[char]
    }
    currentNode.isWord = true
  }

  return root
}

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const fillCrossword = (words: string[]): Grid | null => {
  const trie = createTrie(words)
  const emptyGrid = Array.from({ length: 5 }, () => Array(5).fill(""))

  const findSolution = (
    grid: Grid,
    row: number,
    col: number,
    usedWords: Set<string>
  ): Grid | null => {
    if (row === 5) {
      return grid
    }

    const nextRow = col === 4 ? row + 1 : row
    const nextCol = col === 4 ? 0 : col + 1

    if (grid[row][col] !== "") {
      return findSolution(grid, nextRow, nextCol, usedWords)
    }

    const getValidCharsForRow = (r: number): Set<string> => {
      let currentNodeForRow = trie
      for (let i = 0; i < col; i++) {
        currentNodeForRow = currentNodeForRow[grid[r][i]] || {}
      }
      return new Set(Object.keys(currentNodeForRow))
    }

    const getValidCharsForCol = (c: number): Set<string> => {
      let currentNodeForCol = trie
      for (let i = 0; i < row; i++) {
        currentNodeForCol = currentNodeForCol[grid[i][c]] || {}
      }
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

      if (col === 4 || row === 4) {
        const currentRow = newRow[row].join("")
        const currentCol = newRow.map((r) => r[col]).join("")

        // Check for duplicates in the row and column
        if (usedWords.has(currentRow) || usedWords.has(currentCol)) {
          continue
        }

        usedWords.add(currentRow)
        usedWords.add(currentCol)
      }

      const solution = findSolution(newRow, nextRow, nextCol, usedWords)
      if (solution) {
        return solution
      }

      if (col === 4 || row === 4) {
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
