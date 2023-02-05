// Based on https://github.com/SriAmin/Harvard-CS50-AI-Projects/tree/main/crossword

type Direction = "across" | "down"

class Variable {
  i: number
  j: number
  direction: Direction
  length: number
  cells: [number, number][]

  constructor(i: number, j: number, direction: Direction, length: number) {
    this.i = i
    this.j = j
    this.direction = direction
    this.length = length
    this.cells = []

    for (let k = 0; k < this.length; k++) {
      this.cells.push([
        this.i + (this.direction === "down" ? k : 0),
        this.j + (this.direction === "across" ? k : 0),
      ])
    }
  }

  toString(): string {
    return JSON.stringify({
      i: this.i,
      j: this.j,
      direction: this.direction,
      length: this.length,
    })
  }

  static fromString(str: string): Variable {
    const { i, j, direction, length } = JSON.parse(str)
    return new Variable(i, j, direction, length)
  }
}

export class Crossword {
  height: number
  width: number
  structure: boolean[][]
  words: Set<string>
  variables: Map<string, Variable>
  overlaps: Map<string, [number, number] | null>

  constructor(structureString: string, words: string[]) {
    // Determine structure of crossword
    const contents = structureString.split("\n")
    this.height = contents.length
    this.width = Math.max(...contents.map((line) => line.length))

    this.structure = []
    for (let i = 0; i < this.height; i++) {
      const row: boolean[] = []
      for (let j = 0; j < this.width; j++) {
        if (j >= contents[i].length) row.push(false)
        else if (contents[i][j] === "_") row.push(true)
        else row.push(false)
      }
      this.structure.push(row)
    }

    // Save vocabulary list
    this.words = new Set(words)

    // Determine variable set
    this.variables = new Map()
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        // Vertical words
        if (this.structure[i][j] && (i === 0 || !this.structure[i - 1][j])) {
          let length = 1
          for (let k = i + 1; k < this.height; k++) {
            if (this.structure[k][j]) {
              length += 1
            } else {
              break
            }
          }
          if (length > 1) {
            const variable = new Variable(i, j, "down", length)
            this.variables.set(variable.toString(), variable)
          }
        }

        // Horizontal words
        if (this.structure[i][j] && (j === 0 || !this.structure[i][j - 1])) {
          let length = 1
          for (let k = j + 1; k < this.width; k++) {
            if (this.structure[i][k]) {
              length += 1
            } else {
              break
            }
          }
          if (length > 1) {
            const variable = new Variable(i, j, "across", length)
            this.variables.set(variable.toString(), variable)
          }
        }
      }
    }

    // Compute overlaps for each word
    // For any pair of variables v1, v2, their overlap is either:
    //    None, if the two variables do not overlap; or
    //    (i, j), where v1's ith character overlaps v2's jth character
    this.overlaps = new Map()
    for (const v1 of this.variables.values()) {
      for (const v2 of this.variables.values()) {
        if (v1.toString() === v2.toString()) continue
        const cells1 = v1.cells
        const cells2 = v2.cells
        const intersection = cells1.filter((cell) =>
          cells2.find(([x, y]) => x === cell[0] && y === cell[1])
        )
        if (intersection.length === 0) {
          this.overlaps.set(`${v1.toString()} ${v2.toString()}`, null)
        } else {
          const first = intersection.pop()
          if (!first) throw new Error("No intersection found")
          this.overlaps.set(`${v1.toString()} ${v2.toString()}`, [
            cells1.findIndex(([x, y]) => x === first[0] && y === first[1]),
            cells2.findIndex(([x, y]) => x === first[0] && y === first[1]),
          ])
        }
      }
    }
  }

  neighbors(variable: string): Set<Variable> {
    return new Set(
      Array.from(this.variables.values()).filter(
        (v) =>
          v.toString() !== variable &&
          this.overlaps.get(`${v.toString()} ${variable.toString()}`)
      )
    )
  }
}

export class CrosswordCreator {
  crossword: Crossword
  domains: Map<string, string[]>

  constructor(crossword: Crossword) {
    this.crossword = crossword
    this.domains = new Map()
    for (const variable of this.crossword.variables.values())
      this.domains.set(variable.toString(), Array.from(this.crossword.words))
  }

  /**
   * Return 2D array representing a given assignment.
   */
  letterGrid(assignment: Map<string, string>): string[][] {
    const letters: string[][] = []
    for (let i = 0; i < this.crossword.height; i++) {
      const row: string[] = []
      for (let j = 0; j < this.crossword.width; j++) {
        row.push("")
      }
      letters.push(row)
    }

    for (const [variable, word] of assignment) {
      const direction = this.crossword.variables.get(variable)!.direction
      for (let k = 0; k < word.length; k++) {
        const i =
          this.crossword.variables.get(variable)!.i +
          (direction === "down" ? k : 0)
        const j =
          this.crossword.variables.get(variable)!.j +
          (direction === "across" ? k : 0)
        letters[i][j] = word[k]
      }
    }

    return letters
  }

  /** 
    Enforce node and arc consistency, and then solve the CSP.
  */
  solve(): Map<string, string> | null {
    this.enforceNodeConsistency()
    this.ac3()
    return this.backtrack(new Map())
  }

  enforceNodeConsistency(): void {
    /*
    Update `self.domains` such that each variable is node-consistent
    (Remove any values that are inconsistent with a variable's unary
    constraints; in this case, the length of the word.)
    */
    for (const [variable, words] of this.domains) {
      const length = this.crossword.variables.get(variable)!.length
      for (let i = 0; i < words.length; i++) {
        if (words[i].length !== length) {
          words.splice(i, 1)
          i--
        }
      }
    }
  }

  revise(x: string, y: string): boolean {
    /*
    Make variable `x` arc consistent with variable `y`.
    To do so, remove values from `self.domains[x]` for which there is no
    possible corresponding value for `y` in `self.domains[y]`.

    Return true if a revision was made to the domain of `x`; return
    false if no revision was made.
    */
    let revised = false
    const overlap = this.crossword.overlaps.get(`${x} ${y}`)

    if (!overlap) return false

    const [i, j] = overlap
    const removeWords: string[] = []

    for (const word of this.domains.get(x)!) {
      let flag = false
      for (const word2 of this.domains.get(y)!) {
        if (word[i] === word2[j]) {
          flag = true
          break
        }
      }
      if (!flag) {
        removeWords.push(word)
        revised = true
      }
    }

    for (const word of removeWords) {
      this.domains.get(x)!.splice(this.domains.get(x)!.indexOf(word), 1)
    }

    return revised
  }

  /**
    Update `self.domains` such that each variable is arc consistent
    If `arcs` is None, begin with initial list of all arcs in the problem
    Otherwise, use `arcs` as the initial list of arcs to make consistent

    Return true if arc consistency is enforced and no domains are empty;
    return false if one or more domains end up empty
  */
  ac3(): boolean {
    const queue: [string, string][] = []
    for (const x of this.domains.keys()) {
      for (const y of this.domains.keys()) {
        if (x !== y) queue.push([x, y])
      }
    }

    while (true) {
      const arc = queue.shift()
      if (!arc) break
      const [x, y] = arc
      if (this.revise(x, y)) {
        if (this.domains.get(x)!.length === 0) return false
        for (const z of this.crossword.neighbors(x)) {
          if (z.toString() !== y) queue.push([z.toString(), x])
        }
      }
    }
    return true
  }

  assignmentComplete(assignment: Map<string, string>): boolean {
    /*
    Return true if `assignment` is complete (i.e., assigns a value to each
    crossword variable); return false otherwise.
    */
    for (const domain of this.domains.keys()) {
      if (!assignment.has(domain)) return false
      else if (assignment.get(domain) === null) return false
    }
    return true
  }

  consistent(assignment: Map<string, string>): boolean {
    /*
    Return true if `assignment` is consistent (i.e., words fit in crossword
    puzzle without conflicting characters); return false otherwise.
    */
    const values = new Set<string>()
    for (const [key, val] of assignment) {
      if (values.has(val)) return false
      else values.add(val)

      const variable = Variable.fromString(key)

      if (variable.length !== val.length) return false

      const neighbourCells = this.crossword.neighbors(key)
      for (const neighbor of neighbourCells) {
        if (assignment.has(neighbor.toString())) {
          const overlap = this.crossword.overlaps.get(
            `${key} ${neighbor.toString()}`
          )
          if (!overlap) throw new Error("overlap is null")
          if (
            assignment.get(neighbor.toString())![overlap[1]] !== val[overlap[0]]
          ) {
            return false
          }
        }
      }
    }
    return true
  }

  orderDomainValues(
    variable: string,
    assignment: Map<string, string>
  ): string[] {
    /*
    Return a list of values in the domain of `var`, in order by
    the number of values they rule out for neighboring variables.
    The first value in the list, for example, should be the one
    that rules out the fewest values among the neighbors of `var`.
    */
    const values = new Map<string, number>()
    const variables = this.domains.get(variable)!
    const neighbors = this.crossword.neighbors(variable)
    for (const variable of variables) {
      if (!assignment.has(variable)) {
        let count = 0
        for (const neighbor of neighbors) {
          if (this.domains.get(neighbor.toString())!.includes(variable)) {
            count += 1
          }
        }
        values.set(variable, count)
      }
    }
    return Array.from(values.keys()).sort(
      (a, b) => values.get(a)! - values.get(b)!
    )
  }

  selectUnassignedVariable(assignment: Map<string, string>): string {
    /*
    Return an unassigned variable not already part of `assignment`.
    Choose the variable with the minimum number of remaining values
    in its domain. If there is a tie, choose the variable with the highest
    degree. If there is a tie, any of the tied variables are acceptable
    return values.
    */
    let min = Infinity
    let max = -Infinity
    let minVar = ""
    for (const [variable, domain] of this.domains) {
      if (!assignment.has(variable)) {
        if (domain.length < min) {
          min = domain.length
          minVar = variable
          max = this.crossword.neighbors(variable).size
        } else if (domain.length === min) {
          const neighbors = this.crossword.neighbors(variable).size
          if (neighbors > max) {
            min = domain.length
            minVar = variable
            max = neighbors
          }
        }
      }
    }
    return minVar
  }

  backtrack(assignment: Map<string, string>): Map<string, string> | null {
    /*
    Using Backtracking Search, take as input a partial assignment for the
    crossword and return a complete assignment if possible to do so.

    `assignment` is a mapping from variables (keys) to words (values).

    If no assignment is possible, return None.
    */
    if (this.assignmentComplete(assignment)) {
      return assignment
    }
    const variable = this.selectUnassignedVariable(assignment)
    for (const value of this.orderDomainValues(variable, assignment)) {
      assignment.set(variable, value)
      if (this.consistent(assignment)) {
        const result = this.backtrack(assignment)
        if (result) {
          return result
        }
      }
      assignment.delete(variable)
    }
    return null
  }
}
