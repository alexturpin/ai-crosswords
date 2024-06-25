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
const INPUT_FILE = new URL(`./words/list.txt`, import.meta.url)
const OUTPUT_FILE = new URL(`./words/evals.csv`, import.meta.url)

// Price (input) $5 / 1 million tokens
const INPUT_TOKEN_COST = 5 / 1e6

// Price (output) $15 / 1 million tokens
const OUTPUT_TOKEN_COST = 15 / 1e6

async function processWords(words: string[]) {
  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          'We are making a crossword puzzle app in the style of the NYT Minis. Small, light, bite sized puzzles to do every day. We have a huge list of terms to pick from, but we want to understand which of these terms would make for a good crossword puzzle answer.\n\nOur target audience is young, likely 20-40 years old, from various backgrounds and countries but likely most familiar with American style of English.\n\nFor each term, your task is to use it in a simple sentence if possible (to determine if it\'s a real word) and if so, give it a rating as a crossword answer on familiarity and guessability.\n\nFor instance, the word "apple" is both a familiar word to most people in our target audience, and an easy one to make a crossword clue for. However, "aretha" as a first name might be familiar to some, but having them guess it requires knowledge of some public figure named "Aretha".\n\n1 - most people have heard of this and should be able to guess it\n2, 3 - harder levels but still guessable\n4 - reserved for guessable terms that require regional or specialized knowledge, maybe less common abbreviations, e.g. "ack" (TCP), CTO, AKC (American Kennel Club)\n5 - this is not a real word / archaic\n    \nPlease output each term, the sentence if possible, and the familiarity and difficulty ratings separated by commas and no extra whitespace or punctuation.\n\nExample input:\napple\naretha\naotea (not a real word)\n\nExample output:\napple,I love red apples,1\naretha,Singer Aretha Franklin,3\naozea,,5',
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
          "aaa,,5\naab,,5\naae,,5\naaf,,5\naah,She let out an aah of relief,3\naal,,5\naam,,5\naan,,5\naap,,5\naar,,5\naas,,5\naau,,5\naba,The ABA is a professional basketball league,4\nabb,,5\nabc,The ABCs are the basics of any subject,1\nabd,,5\nabe,Abe Lincoln was the 16th President of the United States,2\nabm,,5\nabo,,5\nabr,,5\nabs,He has strong abs from working out,2\nabt,,5\nabu,Abu is the monkey in Aladdin,3\naby,,5\naca,The ACA is also known as Obamacare,4\nacc,,5\nacd,,5\nace,He served an ace in the tennis match,1\nach,,5\naci,,5\nack,He sent an ACK to confirm receipt of the message,4\nacl,He tore his ACL during the game,3\nacn,,5\nacr,,5\nacs,,5\nact,She played the lead role in the school act,1\nacu,,5\nacv,,5\nada,Ada Lovelace is considered the first computer programmer,3\nadc,,5\nadd,Please add these numbers,1\nade,Lemonade is a refreshing drink,2\nadj,,5\nadl,,5\nadm,,5\nadn,,5\nado,Much ado about nothing,2\nadp,,5\nads,Online ads can be very annoying,1\nadt,,5\nadu,,5\nadv,,5\nadz,He used an adz to shape the wood,3\naec,,5\naef,,5\naei,,5\naeo,,5\naer,,5\naes,,5\naet,,5\nafb,,5\nafc,,5\naff,,5\nafg,,5\nafi,,5\nafk,He went AFK during the game,4\nafl,The AFL is a professional football league,4\nafp,,5\nafr,,5\nafs,,5\naft,The ship's aft section,3\naga,,5\nage,What is your age?,1\nagh,,5\nagi,,5\nagn,,5\nago,That happened a long time ago,1\nagr,,5\nags,,5\nagt,,5\naha,Aha! I found it!,1\nahh,Ahh, that feels good,3\nahi,Ahi tuna is delicious,3\nahl,,5\nahn,,5\naho,,5\nahs,,5\naia,,5\naid,He gave first aid to the injured person,1\naig,,5\naii,,5\nail,He began to ail after the long journey,3\naim,His aim was perfect,1\nain,,5\nair,The air is fresh today,1\nais,,5\nait,,5\naix,,5\naja,,5\najo,,5",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: words.join("\n"),
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

async function processBatch(startLine: number, words: string[]): Promise<void> {
  const { data, cost } = await processWords(words)

  await appendFile(OUTPUT_FILE, data.trim() + "\n", "utf-8")

  totalCost += cost
  console.log(
    `${((startLine / 112078) * 100).toFixed(2)}% $${totalCost.toFixed(2)}`
  )
}

async function main() {
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

  // Process any remaining words in the last batch
  if (batch.length > 0) {
    await processBatch(currentLine, batch)
  }

  console.log("Processing complete.")
}

main().catch(console.error)
