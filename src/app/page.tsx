"use server";

import { useState } from "react";

function LLMEvaluator() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLlmResponse(null);
    
    try {
      const response = await fetch("/api/evaluate", { // Your backend endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputText }), // Send the prompt in the request body
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      const llmResponse = data.llmResponse; // Access the LLM response from the backend
    } catch (error: any) {
      console.error("Error sending prompt:", error);
      setError(error.message || "An error occurred.");
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

        {llmResponse && (
          <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-lg bg-gray-100 p-4"> {/* Added background for better visibility */}
            <h2 className="text-lg font-bold mb-2">Evaluation Result:</h2> {/* Added a heading */}
            <pre className="whitespace-pre-wrap">{llmResponse}</pre> {/* Use <pre> for preserving formatting */}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              id="promptInput"
              placeholder="Enter your prompt for LLM evaluation..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-200 border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Evaluating..." : "Evaluate"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default LLMEvaluator;