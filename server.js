import express from "express";
import { OpenAI } from "openai";
import fs from 'node:fs/promises';
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import { generateImageCaption, generatePDFCaption } from "./file2text.js";
import { processDocxFile } from "./docxext.js";
import { loadDocuments } from "./xltrial.js";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import complainceRoutes from './routes/complainceRoutes.js';
import cors from 'cors';
import connectDB from './utils/connectDB.js';
import mailRoutes from './routes/mailRoutes.js';
import Stripe from 'stripe';
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import mime from 'mime-types';
import PaymentDetails from './models/UserModel.js';
import User from './models/UserModel.js';
import ControlData from './models/complianceModel.js';
import ChatHistory from './models/chatHistoryModel.js';
import { updateUserSubscription } from "./utils/updateUser.js";
import { ObjectId } from 'mongodb';

dotenv.config();
const stripe = new Stripe(process.env.stripe_secret);
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

const openai = new OpenAI({
    apiKey: process.env.openai,
});

const isProduction = process.env.NODE_ENV === 'production';
// const port = process.env.PORT || 3000;
const base = process.env.BASE || '/';

const templateHtml = isProduction
    ? await fs.readFile('./dist/client/index.html', 'utf-8')
    : ''
const ssrManifest = isProduction
    ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
    : undefined

export const app = express()
connectDB();

let vite
if (!isProduction) {
    const { createServer } = await import('vite')
    vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base,
    })
    app.use(vite.middlewares)
} else {
    const compression = (await import('compression')).default
    const sirv = (await import('sirv')).default
    app.use(compression())
    app.use(base, sirv('./dist/client', { extensions: [] }))
}

app.use(cors({
    origin: ['https://www.miporis.com', 'https://miporis.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://admin.miporis.com', 'https://admin-miporis.vercel.app', 'https://app-miporis-eight.vercel.app', 'https://miporis-liart.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));



app.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (request, response) => {
        let event = request.body;
        const endpointSecret = process.env.webhook_secret;
        let data;

        if (endpointSecret) {
            const signature = request.headers['stripe-signature'];
            try {
                event = stripe.webhooks.constructEvent(
                    request.body,
                    signature,
                    endpointSecret
                );
            } catch (err) {
                console.log(`⚠️  Webhook signature verification failed.`, err.message);
                return response.sendStatus(400);
            }
        }

        let subscription;
        let status;
        data = event.data;

        switch (event.type) {

            case 'invoice.payment_succeeded': {
                const invoice = data.object;
                const subscriptionId = invoice.subscription;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                user = await User.findOne({ customerId: subscription.customer });
                if (user) {
                    user.hasAccess = true; // Retain access on successful payment
                    await user.save();
                } else {
                    console.error(`No user found for customer ID: ${subscription.customer}`);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = data.object;
                const subscriptionId = invoice.subscription;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                user = await User.findOne({ customerId: subscription.customer });
                if (user) {
                    user.hasAccess = false; // Remove access on payment failure
                    await user.save();
                } else {
                    console.error(`No user found for customer ID: ${subscription.customer}`);
                }
                break;
            }
            case 'checkout.session.completed': {
                let user;
                const session = await stripe.checkout.sessions.retrieve(
                    data.object.id,
                    {
                        expand: ['line_items']
                    }
                );
                const customerId = session?.customer;
                const customer = await stripe.customers.retrieve(customerId);
                const priceId = session?.line_items?.data[0]?.price.id;
            
                if (customer.email) {
                    user = await User.findOne({ email: customer.email });
            
                    if (!user) {
                        user = await User.create({
                            email: customer.email,
                            userName: customer.name,
                            customerId
                        });
                        await user.save();
                    }
                } else {
                    console.error('No user found');
                    throw new Error('No user found');
                }
            
                user.priceId = priceId;
                user.hasAccess = true;
                user.customerId = customerId;
                user.sessionId = data.object.id;
                
if (priceId === process.env.Enterprise_monthly || priceId === 'price_1QognHQ0hqQaD2vKOXJMagNb') {
    user.role = 'superadmin';
}

                
                await user.save();
                break;
            }
            
            case 'customer.subscription.deleted': {
                const subscription = await stripe.subscriptions.retrieve(
                    data.object.id
                );
                const user = await User.findOne({
                    customerId: subscription.customer
                });

                user.hasAccess = false;
                await user.save();

                break;
            }
            case 'customer.subscription.updated': {
                const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
                const user = await User.findOne({ customerId: subscription.customer });

                if (!user) {
                    console.error(`No user found for customer ID: ${subscription.customer}`);
                    throw new Error(`No user found for customer ID: ${subscription.customer}`);
                }
                user.priceId = subscription.items.data[0]?.price.id || user.priceId;
                user.hasAccess = subscription.status === 'active';

                await user.save();

                console.log(`Updated subscription details for user: ${user.email}`);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}.`);
        }

        response.send();
    }
);


app.use(express.static("public"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/', complainceRoutes);
app.use('/api/admin', adminRoutes);


app.post('/upload-control-data', async (req, res) => {
    try {
        const { data } = req.body;
        const controls = data.map(item => {
            if (item.Compliance === 'Y') {
                item.score = 100;
                item.compliant_result = 'C';
            }
            return item;
        });
        const insertedData = await ControlData.insertMany(controls);
        res.status(200).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// http://localhost:4173/get-control-data?Control_type=GFCF&userId=123
app.get('/get-control-data', async (req, res) => {
    try {
        const { Control_type, userId } = req.query;
        if (!Control_type || !userId) {
            return res.status(400).json({ success: false, error: 'Control_type and userId are required' });
        }

        const controlData = await ControlData.find({
            compliant_type: Control_type,
            userId: userId
        });
        res.status(200).json({ success: true, data: controlData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/get-control-data-by-id', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID is required' });
        }
        const controlData = await ControlData.findById(id);
        if (!controlData) {
            return res.status(404).json({ success: false, error: 'No data found with the provided ID' });
        }
        res.status(200).json({ success: true, data: controlData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/delete-control-data', async (req, res) => {
    try {
        const { Control_type, userId } = req.query;

        if (!Control_type || !userId) {
            return res.status(400).json({ success: false, error: 'Control_type and userId are required' });
        }
        const deleteResult = await ControlData.deleteMany({
            compliant_type: Control_type,
            userId: userId
        });

        const userHistoryDeleteResult = await ChatHistory.deleteMany({
            userId: userId,
            controlType: Control_type
        });

        res.status(200).json({
            success: true,
            message: `${deleteResult.deletedCount} records deleted successfully.`,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/delete-account', async (req, res) => {
    try {
        const { userId, Control_type } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Control_type and userId are required' });
        }
        const deleteResult = await ControlData.deleteMany({
            userId: userId
        });

        const userDeleteResult = await User.deleteOne({
            _id: userId
        });

        const userHistoryDeleteResult = await ChatHistory.deleteMany({
            userId: userId
        });
        console.log(Control_type, userHistoryDeleteResult)
        if (userDeleteResult.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({
            success: true,
            message: `Account deleted successfully.`,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/get-all-data', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }
        const controlData = await ControlData.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$compliant_type",
                    controls: { $push: "$$ROOT" },
                    totalCount: { $sum: 1 },
                    compliantCount: {
                        $sum: {
                            $cond: [{ $eq: ["$compliant_result", "C"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    compliance_percentage: {
                        $concat: [
                            {
                                $toString: {
                                    $round: [
                                        { $multiply: [{ $divide: ["$compliantCount", "$totalCount"] }, 100] },
                                        0
                                    ]
                                }
                            },
                            "%"
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    compliant_type: "$_id",
                    compliance_percentage: 1,
                    controls: 1
                }
            }
        ]);

        res.status(200).json({ success: true, data: controlData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/getsd-data', async (req, res) => {
    try {
        const { userId } = req.query;
        const user_query = req.query.prompt;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }
        const chatHistoryDocs = await ChatHistory.find(
            {
                userId: userId,
                controlId: "MAINBOT"
            }
        ).sort({ createdAt: 1 }).select('type text');

        const chathis = chatHistoryDocs
            .map(doc => `${doc.type === 'user' ? 'User' : 'Bot'}: ${doc.text}`)
            .join("\n\n");

        const controlDatas = await ControlData.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$compliant_type",
                    controls: { $push: "$$ROOT" },
                    totalCount: { $sum: 1 },
                    compliantCount: {
                        $sum: {
                            $cond: [{ $eq: ["$compliant_result", "C"] }, 1, 0]
                        }
                    },
                    ncControlIds: {
                        $push: {
                            $cond: [
                                { $eq: ["$compliant_result", "NC"] },
                                "$Control ID",
                                null
                            ]
                        }
                    },
                    pcControlIds: {
                        $push: {
                            $cond: [
                                { $eq: ["$compliant_result", "PC"] },
                                "$Control ID",
                                null
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    ncControlIds: {
                        $filter: {
                            input: "$ncControlIds",
                            as: "id",
                            cond: { $ne: ["$$id", null] }
                        }
                    },
                    pcControlIds: {
                        $filter: {
                            input: "$pcControlIds",
                            as: "id",
                            cond: { $ne: ["$$id", null] }
                        }
                    },
                    compliance_percentage: {
                        $concat: [
                            {
                                $toString: {
                                    $round: [
                                        { $multiply: [{ $divide: ["$compliantCount", "$totalCount"] }, 100] },
                                        0
                                    ]
                                }
                            },
                            "%"
                        ]
                    }, ncControlIdsLength: { $size: "$ncControlIds" },  // Length of ncControlIds
                    pcControlIdsLength: { $size: "$pcControlIds" }
                }
            },
            {
                $project: {
                    _id: 0,
                    compliant_type: "$_id",
                    compliance_percentage: 1,
                    ncControlIds: 1,
                    pcControlIds: 1
                }
            }
        ]);

        const filldata = JSON.stringify(controlDatas)
        const sys_prompt = `You are a smart assistant bot that helps users in a website.
        In the website we offer compliance evaluation services which is done by an evaluation bot.The allowed file formats in the evaluation bot is PDFs, single excel sheet excel files, Word Docs and Images.
        User comes to you to ask FAQs or may come in general and ask you what work is pending. nc-non compliant, pc- partial compliant. Give precedence for pc to be completed before nc as it is easier to finish.
        If extra evidence not available for pc let them continue with nc. Dont give the list of nc and pc until explicitly asked for all. just give length until then.
        You will be given lists of Non-Compliant and Partial-Compliant control ids. Control ids refer to set of compliances that he wants to check.
        Max turnarount time for compliance evaluation is 5 minutes. Multiple files can be uploaded at once. The evaluation bot evaluates the control ids based on submitted evidence. The submitted files are saved for future references. Evidences can be reuploaded if the previous submission is only partial compliant. The evaluation bot lets us know what is the requirement for compliance,which will help the user further improve his compliance and attain full compliance. It is better not to upload wrong files as it can mess with the calculation. Manual Review can be raised incase of disagreement with the bot. As of now manual review is not available but it will be very soon. 
        Your job is to help the user with the information you have.Chat History of User:"${chathis}" Following is the data of this user: "${filldata}" Answer with this information user's query. `

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: sys_prompt },
                { role: "user", content: user_query }
            ],
        });

        const results = response.choices[0].message.content;

        if (user_query !== "greet and guide me with the analytics you have?") {
            await new ChatHistory({
                userId,
                chatbotId: "MAINBOT",
                type: 'user',
                text: user_query,
                createdAt: new Date(),
                controlType: "MAINBOT"
            }).save();
        }
        await new ChatHistory({
            userId,
            chatbotId: "MAINBOT",
            type: 'bot',
            text: results,
            createdAt: new Date(),
            controlType: "MAINBOT"
        }).save();

        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, error: err.message });
    }
});

// query, history, controlData
// http://localhost:4173/cstrokeWidth?query=Hello&userId=123&controlId=P2P.01.01
app.get("/chat-completions", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { query, userId, controlId, controlType } = req.query;

    if (!query || !userId || !controlId) {
        res.write(`data: ${JSON.stringify({ error: "Missing required parameters" })}\n\n`);
        return res.end();
    }

    try {
        const chatHistoryDocs = await ChatHistory.find(
            {
                userId: userId,
                chatbotId: controlId
            }
        ).sort({ createdAt: 1 }).select('type text');

        const chatHistory = chatHistoryDocs
            .map(doc => `${doc.type === 'user' ? 'User' : 'Bot'}: ${doc.text}`)
            .join("\n\n");

        const controlDataDocs = await ControlData.find({
            "Control ID": controlId,
            // compliant_type: "GFCF",
            userId: userId
        });

        const controlData = JSON.stringify(controlDataDocs)

        const prompt = `
      You are a smart helpful bot helping people achieve their corporate governence. You will be provided with all relevent data for a particular compliant id given below, You are restricted to talk about that particular control id data only and you are integreted in a system where people will also upload evidences and complete their corporate governence and you will be able to know this through a json that we will be providing below.
      This json will have all the information about the compliant id, the document uploaded by the user, and you will have this in the chat history as well, 
  
      Example control ID data:
      {
        "_id": "6756dfbe4efa678fe1ca1f85",
        "Control ID": "ELC.01.04",
        "IMEX": "X",
        "Factory": "X",
        "Process": "Entity Level Controls",
        "Sub-process": "Control Environment",
        "Risk": "Employees act in an unethical manner with legal, regulatory or reputational implications.",
        "Control header": "Code of conduct",
        "Control description": "Code of conduct\nAppropriate communication and training (where relevant) for employees.",
        "Frequency": "Annually",
        "Corporate Policy Reference": "Corporate Policies: Code Of Conduct",
        "Suggested Test Guidance": "1. Obtain and review a list from HR highlighting which employees had completed relevant training.",
        "SAP Sunrise RACM control #": "Follow GFCF",
        "SAP Turbo RACM control #": "Follow GFCF",
        "Relevance": "Y",
        "Compliance": "Y",
        "compliant_type": "Community Policy",
        "userId": "6754240120127429a58bc7a",
        "compliant_result": "NC",
        "score": 0,
        "uploadHistory": [
          {
            "score": 0,
            "remark": "The document has some issues. It does not fully align with any of the standards.",
            "files": [
              {
                "fileName": "ELC.02.01.pdf",
                "fileUrl": "https://miporis.s3.eu-north-1.amazonaws.com/1733775706284-ELC.02.01.pdf"
              }
            ]
          },
          {
            "score": 0,
            "remark": "The document has some issues. It does not fully align with any of the standards.",
            "files": [
              {
                "fileName": "Official List of Employees Compliance Passport training.pdf",
                "fileUrl": "https://miporis.s3.eu-north-1.amazonaws.com/1733775826292-Official%20List%20of%20Employees%20Compliance%20Passport%20training.pdf"
              }
            ]
          }
        ]
      }
      Here you can see the uploadHistory and the score based on document uploaded by the user. Whenver the user upload a document an array of score, remark and files details will be appended to the uploadHistory. Your goal is to give a textual response to help the user to get the score to 100 by uploading the right document.
  
    Here is the data for that control ID with which you can help the user:
    "${controlData || "No data available."}"
  
    ---
    
    Here is the previous chat history:
    "${chatHistory || "No prior chat history available."}"
  
    ---
    
    When a user asks about compliance or the next steps to complete compliance for the control ID, you should be supportive and provide concise, clear guidance throughout the process.
    
    Now, provide a response for the user query
      `;

        // Stream the response from OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: query }
            ],
        });

        const result = response.choices[0].message.content;

        if (query !== "greet and give the list of required document to get compliant?") {
            await new ChatHistory({
                userId,
                chatbotId: controlId,
                type: 'user',
                text: query,
                createdAt: new Date(),
                controlType: controlType
            }).save();
        }
        await new ChatHistory({
            userId,
            chatbotId: controlId,
            type: 'bot',
            text: result,
            createdAt: new Date(),
            controlType: controlType
        }).save();

        res.json({ content: result });
    } catch (error) {
        console.error("Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

app.post("/upload", upload.array("files", 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded." });
        }
        const accessKey = process.env.AWS_ACCESS_KEY_ID
        const secretKey = process.env.AWS_SECRET_ACCESS_KEY
        const region = process.env.S3_REGION
        const Bucket = process.env.S3_BUCKET
        const s3Client = new S3Client({
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey
            },
            region,
        });

        const fileUploadPromises = files.map(async (file) => {
            const uploadParams = {
                ACL: "public-read",
                Bucket,
                Key: `${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: mime.lookup(file.originalname) || "application/octet-stream",
            };

            const uploader = new Upload({
                client: s3Client,
                params: uploadParams,
            });

            const result = await uploader.done();
            return { fileName: file.originalname, fileUrl: result.Location };
        });

        const uploadedFiles = await Promise.all(fileUploadPromises);
        const files2 = uploadedFiles;
        const controlId = req.body.controlId;
        const userId = req.body.userId;
        const controlType = req.body.controlType;
        if (!files2 || files2.length === 0) {
            res.write(`data: ${JSON.stringify({ error: "No files uploaded" })}\n\n`);
            return res.end();
        }

        try {
            let combinedText = '';

            for (let i = 0; i < files2.length; i++) {
                const file = files2[i];
                const fileUrl = file.fileUrl;

                combinedText += `\nDocument No.${i + 1}:\n`;

                if (fileUrl.endsWith(".pdf")) {
                    combinedText += await generatePDFCaption(fileUrl);
                } else if (fileUrl.endsWith(".xlsm") || fileUrl.endsWith(".xlx") || fileUrl.endsWith(".xlms")) {
                    const filenames = fileUrl.split('/').pop();
                    combinedText += await loadDocuments(filenames);
                } else if (fileUrl.endsWith(".jpg") || fileUrl.endsWith(".png") || fileUrl.endsWith(".jpeg")) {
                    combinedText += await generateImageCaption(fileUrl);
                } else if (fileUrl.endsWith(".docx")) {
                    combinedText += await processDocxFile(fileUrl);

                    //combinedText += "Document not supported";
                } else {
                    res.write(`data: ${JSON.stringify({ error: `Unsupported file type: ${originalname} ` })}\n\n`);
                    continue;
                }
                combinedText += `\n\n---\n`;
            }
            // console.log(Combined Text: ${combinedText || "No data available."});

            const document = combinedText || "No document content found.";

            // Fetch control data
            const controlDataDocs = await ControlData.find({
                "Control ID": controlId,
                userId: userId
            });

            const controlData = JSON.stringify(controlDataDocs)

            const chatHistoryDocs = await ChatHistory.find(
                {
                    userId: userId,
                    chatbotId: controlId
                }
            ).sort({ createdAt: 1 }).select('type text'); // Use select for projection

            const chatHistory = chatHistoryDocs
                .map(doc => `${doc.type === 'user' ? 'User' : 'Bot'}: ${doc.text}`)
                .join("\n\n");

            const prompt = `
                You are a smart evaluation bot tasked with assessing the compliance of documents uploaded by users against specific control IDs. You will evaluate the data parsed from PDFs and images, analyze the document summary, and determine compliance based on the provided control ID data and chat history. Your response must strictly adhere to the JSON format provided below.
            
                Here is the Control ID data: 
                "${controlData || "No data available."}"
            
                ----
            
                Here is the previous chat history:
                "${chatHistory || "No prior chat history available."}"
            
                ----
            
                Here is the Document summary for the document uploaded: 
                ${document}
            
                Instructions:
                You are a compliance auditor. Based on the provided Document summary, the Suggested Test Guidance in the Control ID data, and the previous Compliance Result, Score, and uploadHistory in the Control ID data, determine the response. Your response must strictly adhere to the JSON format below:
                {
                    "compliant_result": "C" / "PC" / "WE" / "NC",
                    "score": 0 to 100,
                    "remarks": "Explain the compliance status of the document and what needs to be done to improve it."
                }
            
                Rules:
                1. Respond *only* with a valid JSON object. Do not include any explanations, escape characters, headers, markdown, newline characters, or formatting such as "\\\`json".
                2. *compliant_result Field*: Determine the Compliance Result based on the score:
                    - Assign "C" for scores 90-100%: Strong match – fully compliant evidence
                    - Assign "PC" for scores 70-89%: Partial compliance – acceptable but could be improved
                    - Assign "WE" for scores 50-69%: Weak evidence – insufficient but relevant
                    - Assign "NC" for scores below 50%: Non-compliant – unrelated or missing
                3. *score Calculation*:
                    - The score should incrementally increase based on the relevance and completeness of the evidence provided in the document.
                    - If the document partially satisfies the Suggested Test Guidance, assign a score proportional to the completeness of the evidence (e.g., 30%, 50%, 70%).
                    - Ensure the score reflects overall progress and cannot decrease from the previously calculated score.
                    - If the same document is uploaded again (based on uploadHistory), do not increase the score. The score should remain the same as the previous upload.
                    - For newly uploaded documents (not in uploadHistory), increase the score based on the relevance and completeness of the evidence.
                4. *Flexibility*:
                    - Be flexible in evaluating the document. If the evidence provided is correct but not overly detailed, consider it acceptable and increase the score accordingly.
                    - Do not require excessively detailed or perfect documents unless explicitly mandated by the control ID.
                    - Do not require the document to be perfect or fully compliant with all Suggested Test Guidance items. Instead, focus on the relevance and completeness of the evidence provided.
            
                Example output (strictly JSON):
                {
                   "compliant_result": "WE", 
                   "score": 60, 
                   "remarks": "The document provides some evidence related to the Suggested Test Guidance items but lacks critical details. To improve compliance, ensure the document includes additional information such as [specific missing details]. The document shows some relevance but needs significant improvement."
                }
            
                *Important Reminder*: 
                - The score should reflect the relevance and completeness of the evidence provided. 
                - Incrementally increase the score for newly uploaded documents that provide relevant evidence.
                - Do not increase the score for duplicate uploads (documents already in uploadHistory).
                - Sometimes, the document contains the signature which was replaced as "Illegible signature" consider it as acceptable evidence.
                - Do not require the document to be perfect or fully compliant with all Suggested Test Guidance items. Instead, focus on the relevance and completeness of the evidence provided.
                - Do not require excessively detailed or perfect documents
            `;

            const userquery = "Check the document and give the response";
            const CalendarEvent = z.object({
                compliant_result: z.enum(["C", "PC", "WE", "NC"]),
                score: z.number(),
                remarks: z.string(),
            });

            try {
                // const response = await openai.chat.completions.create({
                //     model: "gpt-4o-mini",
                //     messages: [
                //         { role: "system", content: prompt },
                //         { role: "user", content: userquery },
                //     ],
                // });

                // const completion = response.choices[0].message.content.trim(); // Trim to remove extra spaces or newlines
                const completion = await openai.beta.chat.completions.parse({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: userquery },
                    ],
                    response_format: zodResponseFormat(CalendarEvent, "event"),
                });

                const completion1 = completion.choices[0].message.parsed;
                try {
                    const parsedResult = completion1;
                    const { compliant_result, score, remarks } = completion1;
                    let mappedCompliantResult = compliant_result ;
                    if (score >= 90) {
                        mappedCompliantResult = "C"; // 90-100%: Strong match – fully compliant evidence
                    } else if (score >= 70) {
                        mappedCompliantResult = "PC"; // 70-89%: Partial compliance – acceptable but could be improved
                    } else if (score >= 50) {
                        mappedCompliantResult = "WE"; // 50-69%: Weak evidence – insufficient but relevant
                    } else {
                        mappedCompliantResult = "NC"; // Below 50%: Non-compliant – unrelated or missing
                    }
                    
                    const updateData = {
                        $set: {
                            compliant_result: mappedCompliantResult,
                            score: score,
                            updatedAt: Date.now(),
                        },
                        $push: {
                            uploadHistory: {
                                score: score,
                                remark: remarks,
                                files: uploadedFiles.map(file => ({
                                    fileName: file.fileName,
                                    fileUrl: file.fileUrl
                                }))
                            }
                        }
                    };

                    const updatedControlData = await ControlData.findOneAndUpdate(
                        { "Control ID": controlId, userId: userId },
                        updateData,
                        {
                            new: true,        // ✅ Return the updated document
                            useFindAndModify: false  // ✅ Optional: avoids deprecation warning in some versions
                        }
                    );

                    const userChat = await new ChatHistory({
                        userId,
                        chatbotId: controlId,
                        files: uploadedFiles,
                        type: 'user',
                        text: 'uploaded a file',
                        createdAt: new Date(),
                        controlType: controlType
                    }).save();
                    const botChat = await new ChatHistory({
                        userId,
                        chatbotId: controlId,
                        type: 'bot',
                        text: remarks,
                        createdAt: new Date(),
                        controlType: controlType
                    }).save();
                    const chatArray = [userChat, botChat];
                    res.status(200).json({
                        status: true, 
                        controlData: updatedControlData,
                        result: {
                            ...parsedResult, uploadHistory: {
                                score: score,
                                remark: remarks,
                                files: uploadedFiles.map(file => ({
                                    fileName: file.fileName,
                                    fileUrl: file.fileUrl
                                }))
                            }
                        }, chat: chatArray
                    });
                } catch (error) {
                    console.log(error)
                    res.status(500).json({ error: "Invalid JSON format in AI response", details: completion });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        } catch (error) {
            res.status(500).json({ error: "An error occurred", details: error.message });
        }
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({ error: "Failed to upload files." });
    }
});

// file, userId, controlData
// http://localhost:4173/upload-check?query=Hello&userId=123&controlId=OTC.03.03
app.get("/upload-check", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // const userMessage = "what else should I provide to get the compliance";
    const { query, userId, controlId } = req.query;
    if (!query || !userId || !controlId) {
        res.write(`data: ${JSON.stringify({ error: "Missing required parameters" })}\n\n`);
        return res.end();
    }

    // let document;
    // if (req.query.file.endsWith('.pdf')) {
    //     document = pdf_run(req.query.file);
    // } else if (['.jpg', '.jpeg', '.png'].some(ext => req.query.file.endsWith(ext))) {
    //     document = image_run(req.query.file);
    // } else {
    //     console.error('Unsupported file type');
    // }

    // const controlData = req.query.controlData;
    const document = `This document is a Letter of Appointment dated 29 June 2015, issued by SPRING Singapore to OCI System Pte. Ltd., located at 809 French Road #05-158, Kitchener Complex, S200809.  The letter appoints OCI System Pte. Ltd. as a pre-qualified Integrated Solution Provider ("ISP") under the Innovation & Capability Voucher (ICV) scheme.

    The appointment covers two integrated solutions:  Accounting Management System and Human Resource Management System. The effective period is from 1 July 2015 to 31 March 2016, extendable at SPRING Singapore's discretion.  Terms and conditions are detailed in the letter and Annex 1 (collectively, the "Letter of Appointment").

    Acceptance requires signing Annex 2 ("Letter of Acceptance") and returning it within one week; failure to do so allows SPRING Singapore to rescind the offer.  Contact information for inquiries is provided: Mr. Remi Choong, remi_choong@spring.gov.sg.

    The letter is signed by Samantha Su (Ms), Director, Capability Promotion Division, SPRING Singapore.  Contact details for SPRING Singapore are included at the bottom: address, phone, fax, and website.  A page number "1" is present in the bottom right corner.  The SPRING Singapore logo is at the top of the page.`

    const controlDataDocs = await ControlData.find({
        "Control ID": controlId,
        userId: userId
    });

    const controlData = controlDataDocs
        .map(doc => {
            return `
        Control ID: ${doc["Control ID"]}
        IMEX: ${doc.IMEX}
        Factory: ${doc.Factory}
        Process: ${doc.Process}
        Sub-process: ${doc["Sub-process"]}
        Risk: ${doc.Risk}
        Control header: ${doc["Control header"]}
        Control description: ${doc["Control description"]}
        Frequency: ${doc.Frequency}
        Corporate Policy Reference: ${doc["Corporate Policy Reference"]}
        Suggested Test Guidance: ${doc["Suggested Test Guidance"]}
        SAP Sunrise RACM control #: ${doc["SAP Sunrise RACM control #"]}
        SAP Turbo RACM control #: ${doc["SAP Turbo RACM control #"]}
        Relevance: ${doc.Relevance}
        Compliance: ${doc.Compliance}
        Compliant Type: ${doc.compliant_type}
        Compliant Result: ${doc.compliant_result}
        Score: ${doc.score}
      `;
        })
        .join("\n\n");

    const prompt = `
      Document summary: 
      "${document}"

      Control ID data: 
      "${controlData || "No data available."}"

      Instructions:
      You are a compliance auditor. Based on the provided document summary and the suggested test guidance in the Control ID data, determine the compliance status. Your response must strictly adhere to the JSON format below:

      {
          "compliant_result": "C" / "NC" / "PC",
          "Score": 0 to 100,
          "Remarks": "Explain what is wrong, why it is not complete, and what steps are required to achieve compliance."
      }

      Rules:
      1. Respond **only** with JSON output. Do not include any explanations, headers, markdown, or formatting such as "\`\`\`json". The response must be valid JSON, and nothing else.
      2. **compliant_result Field**: Use "C" for full compliance, "NC" for no compliance, and "PC" for partial compliance.
      3. **Score Field**: Assign a numerical score from 0 to 100. This score should be decided based on the level of compliance. Check the score in the Control ID data, it should not be decreased, it can only be increased if the user uploaded the right document.
      4. **Remarks Field**: Provide a detailed explanation:
          - What is wrong: Highlight specific discrepancies or missing components in the document.
          - Why it is not complete: Explain how the document falls short of the test guidance.
          - What else needs to be done: Recommend specific actions or steps required to achieve full compliance.
      5. Ensure the response is valid JSON. Invalid JSON or any text outside the JSON structure will be rejected.
        
      Strict rules for the response format:
      - If any compliant_result or score is "C" or 100 then both need to be "C" and 100 respectively.
      Example output (strictly JSON):
      {
          "compliant_result": "PC",
          "Score": 75,
          "Remarks": "The document does not include evidence for Section 4. It also lacks proper citations for referenced standards. To achieve full compliance, add supporting evidence for Section 4 and include citations for the referenced standards."
      }
    `;

    const userquery = "Check the document and give the response"

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: userquery },
            ],
        });

        const completion = response.choices[0].message.content.trim();

        try {
            const parsedResult = JSON.parse(completion);
            const { compliant_result, Score, Remarks } = parsedResult;
            await ControlData.updateOne(
                { "Control ID": controlId, userId: userId },
                { $set: { compliant_result: compliant_result, score: 70 } }
            );
            res.json({ result: parsedResult });
        } catch (error) {
            res.status(500).json({ error: "Invalid JSON format in AI response", details: completion });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// http://localhost:4173/upload-check
app.post('/upload-check2', upload.array('documents'), async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Retrieve the files from the request
    const files = req.files;
    if (!files || files.length === 0) {
        res.write(`data: ${JSON.stringify({ error: "No files uploaded" })}\n\n`);
        return res.end();
    }

    try {
        let combinedText = '';

        // Process each file based on its type
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const { buffer, mimetype, originalname } = file;

            // Add a separator with the document number
            combinedText += `\n-- -\nDocument No.${i + 1}: \n`;

            if (mimetype === 'application/pdf') {
                combinedText += await pdfToText(buffer);
            } else if (mimetype === 'application/msword' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                combinedText += await wordToText(buffer);
            } else if (mimetype.startsWith('image/')) {
                combinedText += await imageToText(buffer);
            } else {
                res.write(`data: ${JSON.stringify({ error: `Unsupported file type: ${originalname}` })}\n\n`);
                continue;
            }
        }

        if (!combinedText) {
            res.write(`data: ${JSON.stringify({ error: "No text extracted from files" })}\n\n`);
            return res.end();
        }

        const document = combinedText || "No document content found.";

        // Compliance-checking logic
        const controlId = req.body.controlId; // Get the Control ID from the request body
        const userId = req.body.userId; // Get the User ID from the request body

        // Fetch control data
        const controlDataDocs = await ControlData.find({
            "Control ID": controlId,
            userId: userId
        });

        const controlData = controlDataDocs
            .map(doc => {
                return `
                    Control ID: ${doc["Control ID"]}
                    IMEX: ${doc.IMEX}
                    Factory: ${doc.Factory}
                    Process: ${doc.Process}
                    Sub-process: ${doc["Sub-process"]}
                    Risk: ${doc.Risk}
                    Control header: ${doc["Control header"]}
                    Control description: ${doc["Control description"]}
                    Frequency: ${doc.Frequency}
                    Corporate Policy Reference: ${doc["Corporate Policy Reference"]}
                    Suggested Test Guidance: ${doc["Suggested Test Guidance"]}
                    SAP Sunrise RACM control #: ${doc["SAP Sunrise RACM control #"]}
                    SAP Turbo RACM control #: ${doc["SAP Turbo RACM control #"]}
                    Relevance: ${doc.Relevance}
                    Compliance: ${doc.Compliance}
                    Compliant Type: ${doc.compliant_type}
                    Compliant Result: ${doc.compliant_result}
                    Score: ${doc.score}
                `;
            })
            .join("\n\n");

        const prompt = `
            Document summary: 
            "${document}"
      
            Control ID data: 
            "${controlData || "No data available."}"
      
            Instructions:
            You are a compliance auditor. Based on the provided document summary and the suggested test guidance in the Control ID data, determine the compliance status. Your response must strictly adhere to the JSON format below:
      
            {
                "compliant_result": "C" / "NC" / "PC",
                "Score": 0 to 100,
                "Remarks": "Explain what is wrong, why it is not complete, and what steps are required to achieve compliance."
            }
      
            Rules:
            1. Respond *only* with JSON output. Do not include any explanations, headers, markdown, or formatting such as "\\\`json". The response must be valid JSON, and nothing else.
            2. *compliant_result Field*: Use "C" for full compliance, "NC" for no compliance, and "PC" for partial compliance.
            3. *Score Field*: Assign a numerical score from 0 to 100. This score should be decided based on the level of compliance. Check the score in the Control ID data, it should not be decreased, it can only be increased if the user uploaded the right document.
            4. *Remarks Field*: Provide a detailed explanation:
                - What is wrong: Highlight specific discrepancies or missing components in the document.
                - Why it is not complete: Explain how the document falls short of the test guidance.
                - What else needs to be done: Recommend specific actions or steps required to achieve full compliance.
            5. Ensure the response is valid JSON. Invalid JSON or any text outside the JSON structure will be rejected.
      
            Example output (strictly JSON):
            {
                "compliant_result": "PC",
                "Score": 75,
                "Remarks": "The document does not include evidence for Section 4. It also lacks proper citations for referenced standards. To achieve full compliance, add supporting evidence for Section 4 and include citations for the referenced standards."
            }
          `;

        const userquery = "Check the document and give the response"

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: userquery },
                ],
            });

            const completion = response.choices[0].message.content.trim();

            try {
                const parsedResult = JSON.parse(completion);
                const { compliant_result, Score, Remarks } = parsedResult;
                await ControlData.updateOne(
                    { "Control ID": controlId, userId: userId },
                    { $set: { compliant_result: compliant_result, score: Score } }
                );
                const userChat = await new ChatHistory({
                    userId,
                    chatbotId: controlId,
                    file: 'https://aclanthology.org/2024.acl-long.75.pdf',
                    type: 'user',
                    text: '',
                    createdAt: new Date()
                }).save();
                const botChat = await new ChatHistory({
                    userId,
                    chatbotId: controlId,
                    type: 'bot',
                    text: Remarks,
                    createdAt: new Date()
                }).save();
                const chatArray = [userChat, botChat];

                res.status(200).json({ status: true, result: parsedResult, chat: chatArray });
            } catch (error) {
                res.status(500).json({ error: "Invalid JSON format in AI response", details: completion });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        res.status(500).json({ error: "An error occurred", details: error.message });
    } finally {
        res.end();
    }
});

// http://localhost:4173/chat-history?userId=123&controlId=P2P.01.01
app.get("/chat-history", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { userId, controlId } = req.query;
    if (!userId || !controlId) {
        return res.json({ error: "Missing required parameters" });
    }
    // ghjk
    try {
        // Fetch chat history from the database
        const chatHistoryDocs = await ChatHistory.find({
            userId: userId,
            chatbotId: controlId
        }).sort({ createdAt: 1 });
        return res.status(200).json({ result: chatHistoryDocs });
    } catch (error) {
        console.error("Error:", error);
        return res.json({ error: error.message });
    }
});

app.use('/api/sendmail', mailRoutes);


// stripe ----------------------------------------------
const plansData = {
    "Basic-monthly": process.env.Basic_monthly,
    "Basic-Yearly": process.env.Basic_monthly,
    "Pro-monthly": process.env.Pro_monthly,        // Changed from Basic_monthly
    "Pro-Yearly": process.env.Pro_monthly,         // Changed from Basic_monthly  
    "Enterprise-monthly": process.env.Enterprise_monthly,  // Changed from Basic_monthly
    "Enterprise-Yearly": process.env.Enterprise_monthly    // Changed from Basic_monthly
}

app.post('/api/payment', async (req, res) => {
    try {
        console.log('Payment request body:', req.body);
        const { planId, email, userId } = req.body; // Change priceId to planId
        
        if (!planId || !email) {
            console.log('Missing required fields:', { planId, email });
            return res.status(400).json({ error: 'Plan ID and email are required' });
        }

        // Get the actual Stripe price ID from your plansData
        const priceId = plansData[planId];
        if (!priceId) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/pricing`,
            customer_email: email,
            metadata: {
                userId: userId || ''
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating payment session:', error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});





app.get('/customer/:customerId', async (req, res) => {
    try {
        const checkout_session = await stripe.checkout.sessions.retrieve(req.params.customerId)
        const customerId = checkout_session.customer;

        const customer = await stripe.customers.retrieve(customerId, {
            expand: ['subscriptions', 'invoice_settings.default_payment_method']
        });

        res.json({ customer, checkout_session });
    } catch (error) {
        console.error("Error fetching customer data:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/manage-payment', async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }
    try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        if (!checkoutSession.customer) {
            return res.status(400).json({ error: 'No customer found for the provided session ID' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: checkoutSession.customer,
            return_url: 'https://app.miporis.com',
        });
        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/plan-name/:priceId', async (req, res) => {
    const { priceId } = req.params;

    try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price || !price.product) {
            return res.status(404).json({ error: 'Price ID not found or product is missing.' });
        }
        const product = await stripe.products.retrieve(price.product);
        if (!product) {
            return res.status(404).json({ error: 'Product not found for the given Price ID.' });
        }
        return res.status(200).json({
            planName: product.name, pricing: {
                amount: (price.unit_amount / 100).toFixed(2),
                currency: price.currency.toUpperCase(),
                interval: price.recurring?.interval || 'one-time'
            }
        });
    } catch (error) {
        console.error(`Error fetching plan name for priceId ${priceId}:`, error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/analytics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const analytics = await ControlData.aggregate([
            {
                $match: { userId: userId }
            },
            {
                $facet: {
                    totalRecords: [
                        {
                            $count: "count"
                        }
                    ],
                    compliantCount: [
                        {
                            $match: { compliant_result: "C" }
                        },
                        {
                            $count: "count"
                        }
                    ]
                }
            },
            {
                $project: {
                    totalRecords: {
                        $arrayElemAt: ["$totalRecords.count", 0]
                    },
                    compliantCount: {
                        $arrayElemAt: ["$compliantCount.count", 0]
                    }
                }
            },
            {
                $addFields: {
                    compliantPercentage: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$compliantCount", "$totalRecords"] },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            }
        ]);

        if (!analytics || analytics.length === 0 || !analytics[0].totalRecords) {
            return res.status(404).json({ message: "No data found for the specified userId" });
        }

        return res.status(200).json(analytics[0]);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/api/historyBtw", async (req, res) => {
    const { userId, from, to } = req.query;
    try {
        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        if (from > to) {
            return res.status(400).json({ message: "Invalid date range: 'from' cannot be after 'to'" });
        }

        const history = await ControlData.find({
            userId,
            updatedAt: { $gte: from, $lte: to },
        });

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/api/history", async (req, res) => {
    const { userId, limit } = req.query;

    try {
        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const query = ControlData.find({ userId, updatedAt: { $exists: true } }).sort({ updatedAt: -1 });
        if (limit) {
            query.limit(parseInt(limit, 10));
        }

        const history = await query.exec();

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.use('*all', async (req, res) => {
    try {
        const url = req.originalUrl.replace(base, '')

        let template
        let render
        if (!isProduction) {
            template = await fs.readFile('./index.html', 'utf-8')
            template = await vite.transformIndexHtml(url, template)
            render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
        } else {
            template = templateHtml
            render = (await import('./dist/server/entry-server.js')).render
        }

        const rendered = await render(url, ssrManifest)

        const html = template
            .replace(`<!--app-head-->`, rendered.head ?? '')
            .replace(`<!--app-html-->`, rendered.html ?? '')

        res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
    } catch (e) {
        vite?.ssrFixStacktrace(e)
        res.status(500).end(e.stack)
    }
})

export default (req, res) => {
    return new Promise((resolve, reject) => {
        app(req, res, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};
