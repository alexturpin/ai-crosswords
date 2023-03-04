import { Crossword, CrosswordCreator } from "./crossword"

const structure = `######_####_
____________
_#####_####_
_##_____###_
_#####_####_
_###______#_
######_####_`

const words = `adversarial
alpha
arc
artificial
bayes
beta
bit
breadth
byte
classification
classify
condition
constraint
create
depth
distribution
end
false
graph
heuristic
infer
inference
initial
intelligence
knowledge
language
learning
line
logic
loss
markov
minimax
network
neural
node
optimization
probability
proposition
prune
reason
recurrent
regression
resolution
resolve
satisfaction
search
sine
start
true
truth
uncertainty`.split("\n")

const crossword = new Crossword(structure, words)
const creator = new CrosswordCreator(crossword)

const assignment = creator.solve()
if (assignment === null) throw new Error("Failed to generate")

console.log(
  creator
    .letterGrid(assignment)
    .map((row) => row.map((l) => l.toUpperCase() || "■").join(""))
    .join("\n")
)
