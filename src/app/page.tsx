"use server";


import LlmEvaluator from "./components/llmEvaluator";
import { evaluatePrompt } from "./actions/evaluatePrompt";

export default async function Home() {
  return <LlmEvaluator evaluatePrompt={evaluatePrompt} />
}