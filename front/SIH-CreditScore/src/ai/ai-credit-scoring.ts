'use server';
/**
 * @fileOverview An AI-powered composite credit scoring flow.
 *
 * - aiCreditScore - A function that calculates a credit score based on user data.
 * - AiCreditScoreInput - The input type for the aiCreditScore function.
 * - AiCreditScoreOutput - The return type for the aiCreditScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCreditScoreInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().describe('Age of the beneficiary'),
    location: z.string().describe('Location of the beneficiary'),
    occupation: z.string().describe('Occupation of the beneficiary'),
  }).describe('Personal information of the beneficiary'),
  financialInfo: z.object({
    income: z.number().describe('Monthly income of the beneficiary'),
    creditHistory: z.string().describe('Credit history of the beneficiary'),
    loanAmount: z.number().describe('Requested loan amount'),
  }).describe('Financial information of the beneficiary'),
});
export type AiCreditScoreInput = z.infer<typeof AiCreditScoreInputSchema>;

const AiCreditScoreOutputSchema = z.object({
  creditScore: z.number().describe('The composite credit score calculated by the AI.'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The risk level associated with the credit score.'),
  insights: z.string().describe('Insights and recommendations based on the credit score.'),
});
export type AiCreditScoreOutput = z.infer<typeof AiCreditScoreOutputSchema>;

export async function aiCreditScore(input: AiCreditScoreInput): Promise<AiCreditScoreOutput> {
  return aiCreditScoreFlow(input);
}

const aiCreditScorePrompt = ai.definePrompt({
  name: 'aiCreditScorePrompt',
  input: {schema: AiCreditScoreInputSchema},
  output: {schema: AiCreditScoreOutputSchema},
  prompt: `You are an AI-powered credit scoring system designed for NBCFDC. 
  Calculate a composite credit score based on the personal and financial information provided.

  Personal Information:
  Age: {{{personalInfo.age}}}
  Location: {{{personalInfo.location}}}
  Occupation: {{{personalInfo.occupation}}}

  Financial Information:
  Income: {{{financialInfo.income}}}
  Credit History: {{{financialInfo.creditHistory}}}
  Loan Amount: {{{financialInfo.loanAmount}}}

  Based on this information, determine the credit score, risk level (Low, Medium, High), and provide insights. 
  Ensure the creditScore is a number between 300-850, riskLevel is Low, Medium, or High, and insights are clear and concise.  The outputted JSON schema Zod descriptions MUST be adhered to.
  `,
});

const aiCreditScoreFlow = ai.defineFlow(
  {
    name: 'aiCreditScoreFlow',
    inputSchema: AiCreditScoreInputSchema,
    outputSchema: AiCreditScoreOutputSchema,
  },
  async input => {
    const {output} = await aiCreditScorePrompt(input);
    return output!;
  }
);
