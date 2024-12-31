import Groq from "groq-sdk";
import { PrismaClient } from '@prisma/client';


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prisma = new PrismaClient();

export async function main() {
  try {
    const chatCompletion = await getGroqChatCompletion();
    const llmResponse = chatCompletion.choices[0]?.message?.content || "";
    const prompt = chatCompletion.messages[0].content; // Extract the prompt

    // Store prompt and initial response
    const dbEntry = await prisma.experiment.create({
      data: {
        prompt,
        llmResponse,
      },
    });


    console.log("LLM Response:", llmResponse);

    //for the llm eval
    const evaluation = await llmAsAJudge(llmResponse, dbEntry.id); //Pass dbEntry.id
    console.log("Evaluation:", evaluation);
  } catch (error) {
    console.error("An error occured:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// test funciton to get a response from llm
export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",

        content: "Explain the importance of fast language models",
      },

    ],
    model: "llama3-8b-8192",
  });
}

//function to judge other llm
export async function llmAsAJudge(response: string): Promise<string> {
  if (!response) {
    return "No response provided to evaluate.";
  }

  try {
    const evaluationPrompt = `
      You are a helpful and discerning AI assistant tasked with evaluating the quality of a given text response.

      Here's the response you should evaluate:

      \`\`\`

      ${response}

      \`\`\`


      Provide a concise evaluation based on the following criteria:
      * **Relevance:** Does the response directly address the prompt?
      * **Factuality:** Is the information accurate and verifiable?
      * **Comprehensiveness:** Does the response cover the key aspects of the topic?
      * **Clarity:** Is the response easy to understand and well-written?
      * **Response time:** How long does it take to repond?

      Give a short summary of the evaluation and then provide a score (out of 5) for each criterion.

      Example output format:
      Summary: The response is generally good but lacks detail on specific applications.
      Relevance: 5/5
      Factuality: 4/5
      Comprehensiveness: 3/5
      Clarity: 5/5
      Response time: 4/5

    `;



    const evaluationResponse = await groq.chat.completions.create({

      messages: [
        {
          role: "user",

          content: evaluationPrompt,
        },
      ],
      model: "gemma2-9b-it", // The model used for evaluation
    });

    const evaluation = evaluationResponse.choices[0]?.message?.content || "Evaluation failed.";

    // Parse scores from the evaluation string
    const scores = parseScores(evaluation);

    // Update database with evaluation and scores
    await prisma.experiment.update({
      where: { id: experimentId },
      data: {
        evaluation,
        relevanceScore: scores.relevance,
        factualityScore: scores.factuality,
        comprehensivenessScore: scores.comprehensiveness,
        clarityScore: scores.clarity,
      },
    });

    return evaluation;

  } catch (error) {

    console.error("Error during evaluation:", error);

    return "Evaluation failed due to an error.";

  }
}

// Helper function to parse scores from the evaluation string
function parseScores(evaluation: string): { relevance: number | null, factuality: number | null, comprehensiveness: number | null, clarity: number | null } {
    const scores: { relevance: number | null, factuality: number | null, comprehensiveness: number | null, clarity: number | null } = { relevance: null, factuality: null, comprehensiveness: null, clarity: null};

    const regex = /(\w+):\s*(\d)\/5/g;
    let match;
    while ((match = regex.exec(evaluation)) !== null) {
        const criterion = match[1].toLowerCase();
        const score = parseInt(match[2], 10);
        if (criterion in scores) {
            scores[criterion as keyof typeof scores] = score;
        }
    }
    return scores;

}


