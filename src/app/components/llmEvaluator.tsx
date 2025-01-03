"use client"

import { useState, useEffect } from "react";
import { processLLMPrompt } from "../api/evaluate/route";

interface LlmEvaluatorProps {
    evaluatePrompt: (
        text: string
    ) => Promise<{ success: boolean; data: string; error?: string }>;

}

export default function llmEvaluator({ evaluatePrompt }: LlmEvaluatorProps) {
  const [llmResults, setLlmResults] = useState<any[]>([]); // State for LLM results
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLlmResults([]); // Reset results before evaluation
    
    
    try {
      
      const response = await evaluatePrompt(inputText);


      if (!response.success) {
        throw new Error(response.error || "Failed to evaluate prompt");
      }
      
      if (response) {
        processLLMPrompt(response.data);
      }
     

    } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to evaluate response"
        );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 bg-[#001f3f]">
      <main className="flex-1 flex flex-col items-center gap-8">
        {error && (
          <div className="w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Render LLM Results */}
        {llmResults && (
          <div className="w-full max-w-4xl p-4 bg-gray-100 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-bold mb-2">Evaluation Results:</h2>
            <div className="grid grid-cols-2 gap-4">
              {llmResults.map((result, index) => (
                <div key={index} className="p-4 bg-white shadow-md rounded-lg">
                  <h3 className="text-md font-semibold">{result.model}</h3>
                  <p>{result.response}</p>
                  <pre>{result.evaluation}</pre>
                  <p>Response Time: {result.responseTime} ms</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              id="promptInput"
              placeholder="Enter your prompt for LLM evaluation..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Evaluating..." : "Evaluate"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

