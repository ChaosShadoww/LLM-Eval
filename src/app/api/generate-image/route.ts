import Groq from "groq-sdk";



const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {

  const chatCompletion = await getGroqChatCompletion();

// Print the completion returned by the LLM.
  const llmResponse = chatCompletion.choices[0]?.message?.content || "";
  console.log(llmResponse);

  //for the llm eval
  const evaluation = await llmAsAJudge(llmResponse);
  console.log("Evaluation:", evaluation);

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

      Give a short summary of the evaluation and then provide a score (out of 5) for each criterion.

      Example output format:
      Summary: The response is generally good but lacks detail on specific applications.
      Relevance: 5/5
      Factuality: 4/5
      Comprehensiveness: 3/5
      Clarity: 5/5

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

    return evaluationResponse.choices[0]?.message?.content || "Evaluation failed.";

  } catch (error) {

    console.error("Error during evaluation:", error);

    return "Evaluation failed due to an error.";

  }





}


