import axios from "axios";
import mammoth from "mammoth";
import JSZip from "jszip";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import mime from 'mime-types';
import { GoogleGenerativeAI } from '@google/generative-ai';

import dotenv from "dotenv";
dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

// Configure AWS S3
const s3Client = new S3Client({
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    },
    region,
});

// Function to fetch the DOCX file from S3 URL
async function fetchDocxFromUrl(fileUrl) {
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
}

// Function to upload images to S3 and return the URL
async function uploadFileToS3(bucketName, fileName, fileBuffer) {
    const uploadParams = {
        ACL: "public-read",
        Bucket: bucketName,
        Key: `${Date.now()}-${fileName}`,
        Body: fileBuffer,
        ContentType: mime.lookup(fileName) || "application/octet-stream",
    };

    const uploader = new Upload({
        client: s3Client,
        params: uploadParams,
    });

    const result = await uploader.done();
    return result.Location; // Return the uploaded file's URL
}

// Function to extract text from the DOCX file
function extractTextFromDocx(buffer) {
    return new Promise((resolve, reject) => {
        mammoth.extractRawText({ buffer })
            .then(result => resolve(result.value))
            .catch(err => reject(err));
    });
}

async function extractAndUploadImages(docxBuffer) {
    const zip = await JSZip.loadAsync(docxBuffer);
    const imageFiles = Object.keys(zip.files).filter(file => file.startsWith("word/media/"));
    
    if (imageFiles.length === 0) {
        return "No images found in the document.";
    }

    const genAI = new GoogleGenerativeAI(process.env.gemini);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

    const imageInputs = [];

    // Prepare Base64 data for all images
    for (const imageFile of imageFiles) {
        const contentBuffer = await zip.files[imageFile].async("nodebuffer");
        const base64Image = contentBuffer.toString("base64");
        const mimeType = getMimeType(imageFile);

        imageInputs.push({
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        });
    }

    // Send all images in a single prompt
    const result = await model.generateContent([
        ...imageInputs,
        "Analyze all the provided images and extract all visible details, including text, numbers, tables, charts, signatures, icons, or any other information. Provide a detailed summary of each image in order.",
    ]);

    return result.response.text(); // Assuming the model's response includes detailed summaries for all images
}

// Helper function to get the MIME type based on file extension
function getMimeType(fileName) {
    const extension = fileName.split(".").pop().toLowerCase();
    const mimeTypes = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
    };
    return mimeTypes[extension] || "application/octet-stream";
}

// Main function to process the DOCX file
export async function processDocxFile(fileUrl){                   //(fileUrl, bucketName, baseKey) {
    try {
         const docxBuffer = await fetchDocxFromUrl(fileUrl);

        const extractedText = await extractTextFromDocx(docxBuffer);
        
        // var uploadedImagecontent = await extractAndUploadImages(docxBuffer, bucketName, baseKey);
        var uploadedImagecontent = await extractAndUploadImages(docxBuffer);

        const fulltext="Text from doc file:"+extractedText+"Images in doc file:"+uploadedImagecontent
        return fulltext;
    } catch (error) {
        console.error("Error processing DOCX file:", error);
        throw error;
    }
}
