import { readFile, writeFile } from "node:fs/promises"

type TrieNode = { [key: string]: TrieNode }

export type Trie = Record<number, TrieNode>

export const createTrie = (words: string[]): TrieNode => {
  const root: TrieNode = {}

  for (let w = 0; w < words.length; w++) {
    let currentNode = root
    const word = words[w]

    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      if (!currentNode[char]) currentNode[char] = {}

      currentNode = currentNode[char]
    }
  }

  return root
}

const INPUT_FILE = new URL(`./answers/answer-evals.csv`, import.meta.url)
const OUTPUT_TRIE_FILE = new URL(`./answers/answer-trie.json`, import.meta.url)
const OUTPUT_RATINGS_FILE = new URL(
  `./answers/answer-ratings.json`,
  import.meta.url
)

const MINIMUM_RATING = 4

readFile(INPUT_FILE, "utf-8").then(async (data) => {
  const words: Record<number, string[]> = {}
  const ratings: Record<string, number> = {}

  const rows = data.split("\n")
  for (const row of rows) {
    if (row.trim() === "") continue

    const parts = row.split(",")
    const word = parts.at(0)!.replaceAll(" ", "")
    const ratingRaw = parts.at(-1)!
    const rating = parseInt(ratingRaw.trim())

    if (!rating || rating >= MINIMUM_RATING) continue

    const len = word.length
    if (!words[len]) words[len] = []

    words[len].push(word)

    if (word !== "await" && word !== "eval") ratings[word] = rating
  }

  const trie = Object.fromEntries(
    Object.entries(words).map(([len, words]) => [len, createTrie(words)])
  )

  await writeFile(OUTPUT_TRIE_FILE, JSON.stringify(trie), "utf-8")
  await writeFile(
    OUTPUT_RATINGS_FILE,
    JSON.stringify(ratings, null, 2),
    "utf-8"
  )
})
