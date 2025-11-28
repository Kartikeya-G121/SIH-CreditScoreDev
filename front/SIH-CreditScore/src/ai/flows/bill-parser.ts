'use server';
/**
 * @fileOverview An AI-powered bill OCR parser.
 *
 * - billParser - A function that parses a bill image and extracts structured data.
 * - BillParserInput - The input type for the billParser function.
 * - BillParserOutput - The return type for the billParser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BillParserInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bill or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BillParserInput = z.infer<typeof BillParserInputSchema>;

const BillParserOutputSchema = z.object({
  vendorName: z.string().describe('The name of the vendor or store.'),
  transactionDate: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  totalAmount: z.number().describe('The total amount of the bill.'),
  category: z.enum(['Electricity', 'Mobile', 'Utilities', 'Healthcare', 'Education', 'Essential', 'Discretionary', 'Other']).describe('The primary category of the expenditure.'),
  lineItems: z.array(z.object({
    description: z.string().describe('The description of the line item.'),
    amount: z.number().describe('The amount for the line item.'),
  })).describe('An array of items purchased.'),
});
export type BillParserOutput = z.infer<typeof BillParserOutputSchema>;

export async function billParser(input: BillParserInput): Promise<BillParserOutput> {
  return billParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'billParserPrompt',
  input: {schema: BillParserInputSchema},
  output: {schema: BillParserOutputSchema},
  prompt: `You are an expert OCR system for parsing Indian receipts and bills. 
  Analyze the provided image of a bill and extract the following information in a structured JSON format.
  - Vendor name
  - Transaction date
  - Total amount
  - A list of all line items with their descriptions and amounts.
  - A primary category for the overall purchase (Electricity, Mobile, Utilities, Healthcare, Education, Essential, Discretionary, Other).
  
  Make sure to adhere to the requested JSON schema and field descriptions.

  Image: {{media url=photoDataUri}}`,
});

const billParserFlow = ai.defineFlow(
  {
    name: 'billParserFlow',
    inputSchema: BillParserInputSchema,
    outputSchema: BillParserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
