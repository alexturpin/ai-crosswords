import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai"
import dedent from "dedent"
import dotenv from "dotenv"
import { constants, createReadStream } from "node:fs"
import { access, appendFile } from "node:fs/promises"
import { createInterface } from "node:readline"
import invariant from "tiny-invariant"

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY!
const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: `
    We are making a crossword puzzle app. This is a list of potential words for us to use.
    We are looking at understanding the difficulty of each term and how common they are.

    Your task is to use each term in a sentence if possible, to determine if they are real words or not.
    Then, please rate every term's difficulty, from 1-5 using the following scale:
    
    1 - Children know of this term
    2 - Most adults have heard of this term
    3 - This will be a challenging term for most people / perhaps an abbreviation
    4 - This term requires specific domain knowledge to know about
    5 - This is not a real term / gibberish / archaic
    
    Please output each term, the sentence if possible, and the difficulty rating separated by commas and no extra whitespace.
  `,
})

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
}

const BATCH_SIZE = 100
const INPUT_FILE = new URL(`./merged-3-7.txt`, import.meta.url)
const OUTPUT_FILE = new URL(`./merged-3-7.csv`, import.meta.url)

// Price (input) $3.50 / 1 million tokens (for prompts up to 128K tokens)
const INPUT_TOKEN_COST = 3.5 / 1e6

// Price (output) $10.50 / 1 million tokens (for prompts up to 128K tokens)
const OUTPUT_TOKEN_COST = 10.5 / 1e6

// Mock function to process words and return CSV ratings
async function processWords(words: string[]) {
  const chatSession = model.startChat({
    generationConfig,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    history: [
      {
        role: "user",
        parts: [
          {
            text: dedent`
              aaa
              aab
              aae
              aaf
              aah
              aal
              aam
              aan
              aap
              aar
              aas
              aau
              aba
              abb
              abc
              abd
              abe
              abm
              abo
              abr
              abs
              abt
              abu
              aby
              aca
              acc
              acd
              ace
              ach
              aci
              ack
              acl
              acn
              acr
              acs
              act
              acu
              acv
              ada
              adc
              add
              ade
              adj
              adl
              adm
              adn
              ado
              adp
              ads
              adt
              adu
              adv
              adz
              aec
              aef
              aei
              aeo
              aer
              aes
              aet
              afb
              afc
              aff
              afg
              afi
              afk
              afl
              afp
              afr
              afs
              aft
              aga
              age
              agh
              agi
              agn
              ago
              agr
              ags
              agt
              aha
              ahh
              ahi
              ahl
              ahn
              aho
              ahs
              aia
              aid
              aig
              aii
              ail
              aim
              ain
              air
              ais
              ait
              aix
              aja
              ajo`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: dedent`
              aaa,AAA offers roadside assistance,2 
              aab,,5
              aae,,5
              aaf,,5
              aah,"Aah," she sighed in relief,2
              aal,,5
              aam,,5
              aan,,5
              aap,,5
              aar,,5
              aas,,5
              aau,,5
              aba,(This could be a word in another language,but not common in English),5
              abb,,5
              abc,Learning your ABCs is the first step,1
              abd,,5
              abe,(Possible abbreviation for Abraham),3
              abm,,5
              abo,(Potentially offensive abbreviation related to aboriginal people),5
              abr,,5
              abs,He did crunches to work his abs,2
              abt,(Short for "about"),3
              abu,,5
              aby,,5
              aca,,5
              acc,(Could be short for "account"),3
              acd,,5
              ace,He served an ace in tennis,2
              ach,,5
              aci,,5
              ack,(Acknowledgement,often used in technical contexts),4
              acl,She tore her ACL playing soccer,3
              acn,,5
              acr,,5
              acs,,5
              act,The second act of the play was more exciting,2
              acu,,5
              acv,(Apple Cider Vinegar),3
              ada,(American Dental Association or Americans with Disabilities Act),3
              adc,(Analog to Digital Converter),4
              add,Please add more sugar to my coffee,1
              ade,(Could be short for "aide"),3
              adj,(Short for "adjective"),3
              adl,(Activities of Daily Living - medical/care context),4
              adm,(Short for "administration"),3
              adn,,5
              ado,Without further ado,let's begin,3
              adp,(Adenosine Diphosphate - Biology),4 
              ads,Online ads can be very targeted,2
              adt,(Short for "automatic daylight saving time"),3
              adu,(Accessory Dwelling Unit - housing context),4
              adv,(Short for "advertisement"),3
              adz,He used an adz to shape the wood,4 
              aec,,5
              aef,,5
              aei,,5
              aeo,,5
              aer,,5
              aes,(Advanced Encryption Standard - cryptography),4
              aet,,5
              afb,(American Farm Bureau),4
              afc,(American Football Conference),3
              aff,(Could be short for "affirmative"),3
              afg,(Afghanistan - country code),3
              afi,(American Film Institute),3
              afk,(Away from keyboard - internet slang),3
              afl,(Australian Football League),3
              afp,(Agence France-Presse - news agency),4
              afr,(Could be short for "Africa"),3
              afs,(Could be short for "Air Force Station"),3
              aft,The aft deck of the boat offered the best views,3
              aga,The aga kept the kitchen warm and cozy,4
              age,What is your age?,1
              agh,"Agh!" he shouted,startled by the noise,2
              agi,(Adjusted Gross Income),3
              agn,,5
              ago,That happened long ago,1
              agr,(Could be short for "agriculture"),3
              ags,(Could be short for "above ground swimming"),3
              agt,(Could be short for "agent"),3
              aha,Aha! I've figured it out!,2
              ahh,"Ahh," she said,enjoying the warm bath,2
              ahi,We had delicious ahi tuna for dinner,3
              ahl,(American Hockey League),3
              ahn,,5
              aho,(Ahoy - nautical term),4
              ahs,(Could be short for "American Horror Story"),3
              aia,(American Institute of Architects),4
              aid,The organization provides aid to disaster victims,2
              aig,(Could be short for "artificial intelligence"),3
              aii,,5
              ail,What ails you?,3
              aim,His aim was true,2
              ain,(Scottish word for "own"),4
              air,We breathe air,1
              ais,(Automatic Identification System - maritime),4
              ait,(A small island - archaic),5
              aix,(Unix-based operating system),4
              aja,,5
              ajo,,5`,
          },
        ],
      },
    ],
  })

  const result = await chatSession.sendMessage(words.join("\n"))

  invariant(
    result.response.usageMetadata,
    "Expected usage metadata to be present"
  )

  const { promptTokenCount: inputTokens, candidatesTokenCount: outputTokens } =
    result.response.usageMetadata

  const responseCost =
    outputTokens * OUTPUT_TOKEN_COST + inputTokens * INPUT_TOKEN_COST
  const roundedCost = Math.round(responseCost * 100) / 100

  return {
    data: result.response.text().split("\n"),
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

let totalCost = 0

async function processBatch(startLine: number, words: string[]): Promise<void> {
  const { data, cost } = await processWords(words)

  await appendFile(OUTPUT_FILE, data.join("\n"), "utf-8")

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
