import { S3Loader } from "@langchain/community/document_loaders/web/s3";
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.gemini);
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const key1 = "1734413556901-R2R.04.07.xlsm";

export async function loadDocuments(key) {
  const loader = new S3Loader({
    bucket: Bucket,
    key: key,
    s3Config: {
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    },
    unstructuredAPIURL: "https://api.unstructured.io/general/v0/general",
    unstructuredAPIKey: "DbBIDBhPF47PBvzk6459FsqPQmHGKb", // This will be soon required
  });

  try {
    const docs = await loader.load();
    const pageContents = {}; // To collect content by page
    const tableInputs = []; // To batch process table HTML content
    const tablePages = []; // To track page numbers for tables

    for (const doc of docs) {
      const pageNumber = doc.metadata.page_number;
      const category = doc.metadata.category;
      const pageContent = doc.pageContent || "";
      const htmlContent = doc.metadata.text_as_html || "";

      if (!pageContents[pageNumber]) {
        pageContents[pageNumber] = ""; // Initialize page content
      }

      if (category === "Table") {
        tableInputs.push({
          inlineData: {
            data: Buffer.from(htmlContent).toString("base64"),
            mimeType: "text/html",
          },
        });
        tablePages.push(pageNumber);
      } else {
        pageContents[pageNumber] += `\n${pageContent}`;
      }
    }

    // Send all table inputs in a single request
    if (tableInputs.length > 0) {
      try {
        const result = await model.generateContent([
          ...tableInputs,
          "Analyze all provided files and extract all visible details, including text, numbers, tables, charts, signatures, icons, or any other information. Provide a very detailed summary(perform calculations,tell what it means) for each table in order.",
        ]);

        const geminiResponses = result.response.text().split("\n\n"); // Assuming responses are separated by double newlines
        tablePages.forEach((pageNumber, index) => {
          pageContents[pageNumber] += `\n[Table Analysis]\n${geminiResponses[index] || "No response for this table."}\n`;
        });
      } catch (error) {
        console.error("Error analyzing tables:", error);
      }
    }

    // Combine content into a single string structured by page
    let content = "";
    for (const [page, text] of Object.entries(pageContents)) {
      content += `Page ${page}:\n${text.trim()}\n\n`;
    }

    return content;
  } catch (err) {
    console.error("Error loading documents:", err);
  }
}


