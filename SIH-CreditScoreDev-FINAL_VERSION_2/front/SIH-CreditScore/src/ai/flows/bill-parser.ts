
export interface BillParserOutput {
    vendorName: string;
    transactionDate: string;
    totalAmount: number;
    category: string;
    lineItems: { description: string; amount: number }[];
}

export async function billParser({ photoDataUri }: { photoDataUri: string }): Promise<BillParserOutput> {
    // Mock response for build
    console.log("Mock billParser called");
    return {
        vendorName: "Mock Vendor",
        transactionDate: "2023-01-01",
        totalAmount: 100.00,
        category: "Groceries",
        lineItems: [
            { description: "Item 1", amount: 50.00 },
            { description: "Item 2", amount: 50.00 }
        ]
    };
}
