import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
require('dotenv').config();


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const prisma = new PrismaClient();



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // Call your LLM API here
    const url = new URL('https://api.openai.com/v1/chat/completions');

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,  // Correct header
        "Content-Type": "application/json",
        "Accept": "application/json",
        // "x-API-Key": process.env.OPENAI_API_KEY || "",
        // "Content-Type": "application/json",
        // Accept: "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        prompt: text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const result = await response.json();

    // Evaluate the LLM response using the llmAsAJudge function
    const evaluation = await llmAsAJudge(result.output);

    // Store the prompt, response, and evaluation in the database
    const savedRecord = await prisma.result.create({
      data: {
        prompt: text,
        output: result.output,
        evaluation,
    
      },
    });

    return NextResponse.json({
      success: true,
      output: result.output, // Assuming the API returns the output as "output"
      evaluation,
      recordId: savedRecord.id, // Return the ID of the saved record
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
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


