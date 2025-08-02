import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the schema for control data
const ControlDataSchema = z.object({
    "Control ID": z.string(),
    "IMEX": z.string(),
    "Factory": z.string(),
    "Process": z.string(),
    "Sub-process": z.string(),
    "Risk": z.string(),
    "Control header": z.string(),
    "Control description": z.string(),
    "Frequency": z.string(),
    "Corporate Policy Reference": z.string(),
    "Suggested Test Guidance": z.string(),
    "SAP Sunrise RACM control #": z.string(),
    "SAP Turbo RACM control #": z.string(),
    "Relevance": z.string().default('Y'),
    "Compliance": z.string().default('N'),
    "compliant_type": z.string(),
    "userId": z.string(),
    "compliant_result": z.enum(['C', 'PC', 'NC']).default('NC'),
    "score": z.number().default(0),
    "uploadHistory": z.array(z.object({
        score: z.number(),
        remark: z.string(),
        files: z.array(z.object({
            fileName: z.string(),
            fileUrl: z.string()
        }))
    })).default([]),
    "updatedAt": z.number()
});

export async function processPDFData(fileUrl, userId, compliant_type) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.gemini);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

        // Fetch the PDF
        const pdfResp = await fetch(fileUrl).then(response => response.arrayBuffer());
        const pdfBase64 = Buffer.from(pdfResp).toString("base64");

        // Generate structured data from PDF
        const result = await model.generateContent([
            {
                inlineData: {
                    data: pdfBase64,
                    mimeType: "application/pdf",
                },
            },
            `Extract all control-related information from this document and format it as a JSON array. Each object in the array should have the following structure:
            {
                "Control ID": string,
                "IMEX": string,
                "Factory": string,
                "Process": string,
                "Sub-process": string,
                "Risk": string,
                "Control header": string,
                "Control description": string,
                "Frequency": string,
                "Corporate Policy Reference": string,
                "Suggested Test Guidance": string,
                "SAP Sunrise RACM control #": string,
                "SAP Turbo RACM control #": string,
                "Relevance": string (default: "Y"),
                "Compliance": string (default: "N")
            }
            
            Return only the JSON array, nothing else. If Control ID is missing for any entry, mark it as invalid.`
        ]);

        // Parse the response and validate against schema
        const extractedData = JSON.parse(result.response.text());
        
        // Process and validate each item
        const processedData = extractedData.map(item => {
            // Add required fields
            const processedItem = {
                ...item,
                userId,
                compliant_type,
                updatedAt: Date.now()
            };

            // Validate against schema
            const validatedData = ControlDataSchema.parse(processedItem);
            
            // Set score and compliant_result based on Compliance
            if (validatedData.Compliance === 'Y') {
                validatedData.score = 100;
                validatedData.compliant_result = 'C';
            }

            return validatedData;
        });

        return processedData;
    } catch (error) {
        console.error("Error processing PDF:", error);
        throw error;
    }
} 