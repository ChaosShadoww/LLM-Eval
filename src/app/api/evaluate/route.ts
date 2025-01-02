import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prisma = new PrismaClient();

// Function to process LLM prompts
export async function processLLMPrompt(prompt: string): Promise<any[]> {
  const llms = ["llama3-8b-8192", "gemma2-9b-it"]; // Add more LLMs as needed
  const results = [];

  for (const model of llms) {
    const startTime = Date.now();

    try {
      // Get the LLM response
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model,
      });

      const responseTime = Date.now() - startTime;
      const llmResponse = response.choices[0]?.message?.content || "No response.";
      const evaluation = await llmAsAJudge(llmResponse);

      // Save experiment data to the database
      await prisma.experiment.create({
        data: {
          prompt,
          model,
          response: llmResponse,
          evaluation,
        
        },
      });

      results.push({
        model,
        response: llmResponse,
        evaluation,
        responseTime,
      });
    } catch (error) {
      console.error(`Error processing model ${model}:`, error);
      results.push({
        model,
        response: "Error generating response.",
        evaluation: "Evaluation could not be performed.",
        responseTime: null,
      });
    }
  }

  return results;
}

// Function to evaluate an LLM's response
export async function llmAsAJudge(response: string): Promise<string> {
  if (!response) return "No response provided to evaluate.";

  const evaluationPrompt = `
    You are an AI assistant tasked with evaluating the following response based on:
    - Relevance
    - Factuality
    - Comprehensiveness
    - Clarity
    Provide a summary and a score out of 5 for each criterion.

    Response:
    """
    ${response}
    """

    Format:
    Summary: ...
    Relevance: .../5
    Factuality: .../5
    Comprehensiveness: .../5
    Clarity: .../5
  `;

  try {
    const evaluationResponse = await groq.chat.completions.create({
      messages: [{ role: "user", content: evaluationPrompt }],
      model: "gemma2-9b-it",
    });

    return evaluationResponse.choices[0]?.message?.content || "Evaluation failed.";
  } catch (error) {
    console.error("Error during evaluation:", error);
    return "Evaluation failed due to an error.";
  }
}

// Endpoint to evaluate LLM prompts
export const evaluatePromptHandler = async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  try {
    const results = await processLLMPrompt(prompt);
    return res.json({ results });
  } catch (error) {
    console.error("Error during prompt evaluation:", error);
    return res.status(500).json({ message: "An error occurred while processing the prompt." });
  }
};
