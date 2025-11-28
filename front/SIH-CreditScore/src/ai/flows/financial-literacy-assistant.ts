'use server';

/**
 * @fileOverview An AI-powered financial literacy assistant chatbot.
 *
 * - askNidhi - A function that answers user's financial literacy questions.
 * - FinancialLiteracyInput - The input type for the askNidhi function.
 * - FinancialLiteracyOutput - The return type for the askNidhi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialLiteracyInputSchema = z.object({
  question: z.string().describe('The user question about financial literacy.'),
});
export type FinancialLiteracyInput = z.infer<typeof FinancialLiteracyInputSchema>;

const FinancialLiteracyOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question.'),
});
export type FinancialLiteracyOutput = z.infer<typeof FinancialLiteracyOutputSchema>;

export async function askNidhi(input: FinancialLiteracyInput): Promise<FinancialLiteracyOutput> {
  return financialLiteracyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialLiteracyPrompt',
  input: {schema: FinancialLiteracyInputSchema},
  output: {schema: FinancialLiteracyOutputSchema},
  prompt: `You are Nidhi, an AI-powered chatbot designed to assist users with financial literacy questions. You should provide clear, concise, and helpful answers.

Question: {{{question}}}`,
});

const financialLiteracyFlow = ai.defineFlow(
  {
    name: 'financialLiteracyFlow',
    inputSchema: FinancialLiteracyInputSchema,
    outputSchema: FinancialLiteracyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
