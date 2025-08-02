import { GoogleGenerativeAI } from '@google/generative-ai';

export async function processPDFContent(pdfContent) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.gemini);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfContent,
          mimeType: "application/pdf",
        },
      },
      'Extract all control-related information from this document. For each control, identify the Control ID, IMEX, Factory, Process, Sub-process, Risk, Control header, Control description, Frequency, Corporate Policy Reference, and Suggested Test Guidance. Return the data in a structured JSON array format where each object represents a control with these fields. If Control ID is missing for any entry, mark it as invalid.',
    ]);

    const extractedData = JSON.parse(result.response.text());
    return extractedData;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
}


export async function generateImageCaption(fileUrl) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.gemini);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

    const imageResp = await fetch(
      fileUrl
    ).then((response) => response.arrayBuffer());

    // Generate caption
    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      'Analyze the provided image and extract all visible details, including text, numbers, tables, charts, signature, icons or any other information. Provide a detailed summary, explaining all the information present in the image, without any greetings, or conversational elements. The summary should explain all text, values, relationships, signature, icons and structural elements as they appear in the image.',
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Error generating caption:", error);
  }
}

export async function generatePDFCaption(fileUrl) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.gemini);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

    // Fetch the pdf
    const pdfResp = await fetch(
      fileUrl
    ).then((response) => response.arrayBuffer());

    // Generate caption
    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(pdfResp).toString("base64"),
          mimeType: "application/pdf",
        },
      },
      'Analyze the provided file document and extract all visible details, including text, numbers, tables, charts, signature, icons or any other information. Provide a more detailed summary, explaining all the information present in the file, without any greetings, or conversational elements. The summary should explain all text, values, relationships, signature, icons and structural elements as they appear in the file document.',
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Error generating caption:", error);
  }
}

async function generateWordCaption(fileUrl) {
  const OpenAI = require("openai");
  const fs = require("fs");
  const dotenv = require('dotenv');
  dotenv.config(); // To load environment variables from a .env file
  const openai = new OpenAI({
    apiKey: process.env.openai,
  });

  const filename = "https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fwww.palatinelibrary.org%2Fsites%2Fdefault%2Ffiles%2F2019-06%2FWord%2520Basics%2520Practice%2520Doc%2520Revised.docx&wdOrigin=BROWSELINK";
  const prompt = "Analyze the provided file document and extract all visible details, including text, numbers, tables, charts, signature, icons or any other information. Provide a more detailed summary, explaining all the information present in the file, without any greetings, or conversational elements. The summary should explain all text, values, relationships, signature, icons and structural elements as they appear in the file document.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: filename },
      ],
    });

    const completion = response.choices[0].message.content.trim();
    return completion;

  } catch (error) {
    console.error("Error generating caption:", error);
  }
}

// generateWordCaption();

