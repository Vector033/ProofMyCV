import type { Metadata } from "next";
import { getLlm } from "@/lib/llm/provider";
import { NewApplicationForm } from "./form";

export const metadata: Metadata = { title: "New application" };

export default function NewApplicationPage() {
  const llm = getLlm();
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New application</h1>
        <p className="mt-1 text-sm text-stone-600">
          Paste the full job description. FactFit lists the skills and problems it asks for and checks them against your
          fact bank.{" "}
          {llm ? `Analysis uses ${llm.name}.` : "No LLM key is set, so the built-in skill extractor is used."}
        </p>
      </header>
      <NewApplicationForm />
    </div>
  );
}
