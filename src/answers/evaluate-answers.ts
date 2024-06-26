import dotenv from "dotenv"
import { constants, createReadStream } from "node:fs"
import { access, appendFile } from "node:fs/promises"
import { createInterface } from "node:readline"
import OpenAI from "openai"
import invariant from "tiny-invariant"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const BATCH_SIZE = 100
const INPUT_FILE = new URL(`./answers/answers.txt`, import.meta.url)
const OUTPUT_FILE = new URL(`./answers/answers.tsv`, import.meta.url)

// Price (input) $5 / 1 million tokens
const INPUT_TOKEN_COST = 5 / 1e6

// Price (output) $15 / 1 million tokens
const OUTPUT_TOKEN_COST = 15 / 1e6

async function processAnswers(answers: string[]) {
  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          'We are making a crossword puzzle app in the style of the NYT Minis. Small, light, bite sized puzzles to do every day. We have a huge list of terms to pick from, but we want to understand which of these terms would make for a good crossword puzzle answer.\n\nOur target audience is young, likely 20-40 years old, from various backgrounds and countries but likely most familiar with American style of English.\n\nFor each term, your task is to use it in a simple sentence if possible (to determine if it\'s a real answer) and if so, give it a rating as a crossword answer on familiarity and guessability.\n\nFor instance, the answer "apple" is both a familiar answer to most people in our target audience, and an easy one to make a crossword clue for. However, "aretha" as a first name might be familiar to some, but having them guess it requires knowledge of some public figure named "Aretha".\n\n1 - most people have heard of this and should be able to guess it\n2, 3 - harder levels but still guessable\n4 - reserved for guessable terms that require regional or specialized knowledge, maybe less common abbreviations, e.g. "ack" (TCP), CTO, AKC (American Kennel Club)\n5 - this is not a real answer / archaic\n    \nPlease output each term, the sentence if possible, and the familiarity and difficulty ratings as tab separated values with no header.\n\nExample input:\nabc\napple\naretha\naotea (not a real answer)\n\nExample output:\nabc\tI know my ABCs\t1\napple\tHe bought apples\t1\naretha\tSinger Aretha Franklin\t3\naozea\t5',
      },
      {
        role: "user",
        content: [
          {
            text: "aaa\naab\naae\naaf\naah\naal\naam\naan\naap\naar\naas\naau\naba\nabb\nabc\nabd\nabe\nabm\nabo\nabr\nabs\nabt\nabu\naby\naca\nacc\nacd\nace\nach\naci\nack\nacl\nacn\nacr\nacs\nact\nacu\nacv\nada\nadc\nadd\nade\nadj\nadl\nadm\nadn\nado\nadp\nads\nadt\nadu\nadv\nadz\naec\naef\naei\naeo\naer\naes\naet\nafb\nafc\naff\nafg\nafi\nafk\nafl\nafp\nafr\nafs\naft\naga\nage\nagh\nagi\nagn\nago\nagr\nags\nagt\naha\nahh\nahi\nahl\nahn\naho\nahs\naia\naid\naig\naii\nail\naim\nain\nair\nais\nait\naix\naja\najo",
            type: "text",
          },
        ],
      },
      {
        role: "assistant",
        content:
          "aaa\t\t5\naab\t\t5\naae\t\t5\naaf\t\t5\naah\tShe let out an aah of relief\t3\naal\t\t5\naam\t\t5\naan\t\t5\naap\t\t5\naar\t\t5\naas\t\t5\naau\t\t5\naba\tThe ABA is a professional basketball league\t4\nabb\t\t5\nabc\tThe ABCs are the basics of any subject\t1\nabd\t\t5\nabe\tAbe Lincoln was the 16th President of the United States\t2\nabm\t\t5\nabo\t\t5\nabr\t\t5\nabs\tHe has strong abs from working out\t2\nabt\t\t5\nabu\tAbu is the monkey in Aladdin\t3\naby\t\t5\naca\tThe ACA is also known as Obamacare\t4\nacc\t\t5\nacd\t\t5\nace\tHe served an ace in the tennis match\t1\nach\t\t5\naci\t\t5\nack\tHe sent an ACK to confirm receipt of the message\t4\nacl\tHe tore his ACL during the game\t3\nacn\t\t5\nacr\t\t5\nacs\t\t5\nact\tShe played the lead role in the school act\t1\nacu\t\t5\nacv\t\t5\nada\tAda Lovelace is considered the first computer programmer\t3\nadc\t\t5\nadd\tPlease add these numbers\t1\nade\tLemonade is a refreshing drink\t2\nadj\t\t5\nadl\t\t5\nadm\t\t5\nadn\t\t5\nado\tMuch ado about nothing\t2\nadp\t\t5\nads\tOnline ads can be very annoying\t1\nadt\t\t5\nadu\t\t5\nadv\t\t5\nadz\tHe used an adz to shape the wood\t3\naec\t\t5\naef\t\t5\naei\t\t5\naeo\t\t5\naer\t\t5\naes\t\t5\naet\t\t5\nafb\t\t5\nafc\t\t5\naff\t\t5\nafg\t\t5\nafi\t\t5\nafk\tHe went AFK during the game\t4\nafl\tThe AFL is a professional football league\t4\nafp\t\t5\nafr\t\t5\nafs\t\t5\naft\tThe ship's aft section\t3\naga\t\t5\nage\tWhat is your age?\t1\nagh\t\t5\nagi\t\t5\nagn\t\t5\nago\tThat happened a long time ago\t1\nagr\t\t5\nags\t\t5\nagt\t\t5\naha\tAha! I found it!\t1\nahh\tAhh, that feels good\t3\nahi\tAhi tuna is delicious\t3\nahl\t\t5\nahn\t\t5\naho\t\t5\nahs\t\t5\naia\t\t5\naid\tHe gave first aid to the injured person\t1\naig\t\t5\naii\t\t5\nail\tHe began to ail after the long journey\t3\naim\tHis aim was perfect\t1\nain\t\t5\nair\tThe air is fresh today\t1\nais\t\t5\nait\t\t5\naix\t\t5\naja\t\t5\najo\t\t5",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: answers.join("\n"),
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 4095,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  const response = result.choices[0].message.content
  invariant(response, "Expected response content to be present")

  invariant(result.usage, "Expected usage metadata to be present")

  const { prompt_tokens: inputTokens, completion_tokens: outputTokens } =
    result.usage

  const responseCost =
    outputTokens * OUTPUT_TOKEN_COST + inputTokens * INPUT_TOKEN_COST
  const roundedCost = Math.round(responseCost * 100) / 100

  return {
    data: response,
    cost: roundedCost,
  }
}

async function getLastProcessedLine(): Promise<number> {
  try {
    // Check if the output file exists
    await access(OUTPUT_FILE, constants.F_OK)

    return new Promise((resolve, reject) => {
      let lineCount = 0
      const rl = createInterface({
        input: createReadStream(OUTPUT_FILE),
        crlfDelay: Infinity,
      })

      rl.on("line", () => {
        lineCount++
      })

      rl.on("close", () => {
        resolve(lineCount)
      })

      rl.on("error", reject)
    })
  } catch (error) {
    // If the file does not exist, start from the beginning
    return 0
  }
}

let totalCost = 10.3

async function processBatch(
  startLine: number,
  answers: string[],
): Promise<void> {
  const { data, cost } = await processAnswers(answers)

  await appendFile(OUTPUT_FILE, data.trim() + "\n", "utf-8")

  totalCost += cost
  console.log(
    `${((startLine / 112078) * 100).toFixed(2)}% $${totalCost.toFixed(2)}`,
  )
}

async function main() {
  try {
    await access(OUTPUT_FILE, constants.F_OK)
  } catch (error) {
    await appendFile(OUTPUT_FILE, "answer\texample\trating\n", "utf-8")
  }

  const startLine = await getLastProcessedLine()
  const rl = createInterface({
    input: createReadStream(INPUT_FILE),
    crlfDelay: Infinity,
  })

  let currentLine = 0
  let batch: string[] = []

  for await (const line of rl) {
    if (currentLine >= startLine) {
      batch.push(line)
      if (batch.length === BATCH_SIZE) {
        await processBatch(currentLine, batch)
        batch = []
      }
    }
    currentLine++
  }

  // Process any remaining answers in the last batch
  if (batch.length > 0) {
    await processBatch(currentLine, batch)
  }

  console.log("Processing complete.")
}

main().catch(console.error)
