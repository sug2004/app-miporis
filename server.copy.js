import fs from 'node:fs/promises'
import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.openai,
});

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 4173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''
const ssrManifest = isProduction
  ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
  : undefined

const app = express()

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

app.use(express.static("public"));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => console.log(err));

const controlDataSchema = new mongoose.Schema({
  "Control ID": String,
  "IMEX": String,
  "Factory": String,
  "Process": String,
  "Sub-process": String,
  "Risk": String,
  "Control header": String,
  "Control description": String,
  "Frequency ": String,
  "Corporate Policy Reference": String,
  "Suggested Test Guidance": String,
  "SAP Sunrise RACM \r\ncontrol #": String,
  "SAP Turbo RACM\r\ncontrol #": String,
  "Relevance": String,
  "Compliance": String,
  "compliant_type": String,
  "userId": String,
  "compliant_result": {
    type: String,
    enum: ['C', 'PC', 'NC'],
    default: 'NC',
    required: true
  },
  "score": {
    type: Number,
    default: 0
  },
  "remark": String
});

const ControlData = mongoose.model('ControlData', controlDataSchema);

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  chatbotId: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  bot: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

async function storeChatHistory(question, answer, userid, chatbotId) {
  const chatData = new ChatHistory({
    userId: userid,
    chatbotId: chatbotId,
    user: question,
    bot: answer,
    createdAt: new Date()
  });

  try {
    await chatData.save();
  } catch (error) {
    console.error('Error storing chat history:', error);
  }
}

app.post('/upload-control-data', async (req, res) => {
  try {
    const { data } = req.body;
    const insertedData = await ControlData.insertMany(data);
    res.status(200).json({ success: true, data: insertedData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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


// app.get("/chat-completions", async (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const query = req.query.query;
//   if (!query) {
//     res.write(`data: ${JSON.stringify({ error: "No query parameter provided" })}\n\n`);
//     return res.end();
//   }
//   const userMessage = "what else should i provide to get the compliance";
//   try {
//     const stream = await openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [{ role: "system", content: query }, { role: "user", content: userMessage }],
//       stream: true,
//     });

//     for await (const part of stream) {
//       res.write(`data: ${JSON.stringify(part.choices[0].delta)}\n\n`);
//     }

//     res.end();
//   } catch (error) {
//     res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
//     res.end();
//   }
// });




// ai -------------------------------
// query, history, row
app.get("/chat-completions", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { query, row, userId, controlId } = req.query;
  if (!query || !userId || !controlId) {
    res.write(`data: ${JSON.stringify({ error: "Missing required query parameters" })}\n\n`);
    return res.end();
  }

  try {
    // Fetch chat history from the database
    const chatHistoryDocs = await ChatHistory.find({ userId, controlId }).sort({ createdAt: 1 });

    // Convert chat history to a formatted string
    const chatHistory = chatHistoryDocs
      .map(doc => `User: ${doc.user}\nBot: ${doc.bot}`)
      .join("\n\n");

    const prompt = `
    You are a compliance expert chatbot, and your goal is to help users understand how to complete compliance for control ID. The response should be conversational and broken down into clear steps. 

    Consider the following details:
    "${row}"

    ---

    Here is the previous chat history:
    "${chatHistory || "No prior chat history available."}"

    ---

    When a user asks about compliance or the next steps to complete compliance for the control ID, you should:
    1. *Provide the first step* based on the control's description and related guidance.
    2. *Wait for the user to confirm completion* of the first step.
    3. *Once confirmed, proceed to the second step*.
    4. *Continue this process* until compliance is achieved.

    Be supportive and provide concise, clear guidance throughout this process.

    ---

    Now, provide a response based on the user query
    `;

    // Stream the response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: query }
      ],
      stream: true,
    });

    let result = '';
    for await (const part of stream) {
      result += part.choices[0].delta.content;
      res.write();
      res.write(`data: ${JSON.stringify(part.choices[0].delta)}\n\n`);
    }

    // Store the new chat in the database
    await new ChatHistory({
      userId,
      chatbotId: controlId,
      user: query,
      bot: result,
      createdAt: new Date()
    }).save();

    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});


// query, file, row
app.get("/upload-check", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // const userMessage = "what else should I provide to get the compliance";
  const query = req.query.query;
  if (!query) {
    res.write(`data: ${JSON.stringify({ error: "No query parameter provided" })}\n\n`);
    return res.end();
  }

  // let document;
  // if (req.query.file.endsWith('.pdf')) {
  //     document = pdf_run(req.query.file);
  // } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].some(ext => req.query.file.endsWith(ext))) {
  //     document = image_run(req.query.file);
  // } else {
  //     console.error('Unsupported file type');
  // }

  // const row = req.query.row;
  const document = `This document is a Letter of Appointment dated 29 June 2015, issued by SPRING Singapore to OCI System Pte. Ltd., located at 809 French Road #05-158, Kitchener Complex, S200809.  The letter appoints OCI System Pte. Ltd. as a pre-qualified Integrated Solution Provider ("ISP") under the Innovation & Capability Voucher (ICV) scheme.

    The appointment covers two integrated solutions:  Accounting Management System and Human Resource Management System. The effective period is from 1 July 2015 to 31 March 2016, extendable at SPRING Singapore's discretion.  Terms and conditions are detailed in the letter and Annex 1 (collectively, the "Letter of Appointment").

    Acceptance requires signing Annex 2 ("Letter of Acceptance") and returning it within one week; failure to do so allows SPRING Singapore to rescind the offer.  Contact information for inquiries is provided: Mr. Remi Choong, remi_choong@spring.gov.sg.

    The letter is signed by Samantha Su (Ms), Director, Capability Promotion Division, SPRING Singapore.  Contact details for SPRING Singapore are included at the bottom: address, phone, fax, and website.  A page number "1" is present in the bottom right corner.  The SPRING Singapore logo is at the top of the page.`
  const row = `Control ID: ELC.04.02
                IMEX: X
                Factory: X
                Process: Entity Level Controls
                Sub-process: Monitoring
                Risk: User access to financial critical systems are not monitored resulting in access to the wrong entity and risk that transactions are not recorded under the correct entity.
                Control header: Access review
                Control description:
                Access review:
                On at least a quarterly basis, with a focus on monitoring changes in access for joiners, movers, and leavers, the Finance Controller reviews access to financially critical systems to ensure that changes in user profiles are valid and amendments have been made on a timely basis.

                The Finance Director approves and signs off on the access review performed.

                Frequency: Quarterly
                Corporate Policy Reference: N/A
                Suggested Test Guidance:
                For markets where system access is managed locally:

                Obtain evidence that the Finance Controller has compared the list of movers/leavers (from the local HR team) to the list of changes of access to financial critical systems to confirm that all changes are valid and complete.
                If unable to identify movers and leavers in the period, evidence should be provided to show the Finance Controller's review of all users (employees, contractors, temporary staff, and trusted parties) to confirm that access to financially critical systems is still valid.
                Obtain evidence that user access to legacy ERP systems has been removed or is only maintained for a limited number of employees.
                Obtain Finance Director sign-off of the access review performed.
                Good practice / Knowledge Sharing:

                Maintain a list of all financially critical systems and keep track of whether user access review has been performed on a quarterly basis.
                Make sure that when users move roles/markets, their access is removed.
                SAP Sunrise RACM control #: Follow GFCF + IT.02.03.16
                SAP Turbo RACM control #: Follow GFCF
                Relevance: Y
                Compliance: Y`

  const prompt = `
        Document summary: 
        "${document}"

        Control ID data: 
        "${row}"

        Instructions:
        You are a compliance auditor. Based on the provided document summary and the suggested test guidance in the Control ID data, determine the compliance status. Your response *must strictly* adhere to the JSON format below:

        {
            "compliant_result": "C" / "NC" / "PC",
            "Score": 0 to 100,
            "Remarks": "Explain what is wrong, why it is not complete, and what steps are required to achieve compliance."
        }

        Rules:
        1. *Strict JSON Only: Respond **only* with JSON output. Do not include any explanations, headers, or additional text outside the JSON structure.
        2. *compliant_result Field*: Assign "C" if the document fully matches the guidance, "NC" if it does not match at all, and "PC" if there is some alignment but it is incomplete.
        3. *Score Field*: Assign a numerical score from 0 (no alignment) to 100 (full alignment) to quantify compliance.
        4. *Remarks Field*: Provide a detailed explanation:
            - *What is wrong*: Highlight the specific discrepancies or missing components in the document.
            - *Why it is not complete*: Explain how the document falls short of the test guidance.
            - *What else needs to be done*: Recommend specific actions or steps required to achieve full compliance.
        5. *Validation Emphasis*: Ensure your output is a valid JSON object. Invalid JSON or any additional text will be rejected.

        Example output (strictly JSON):
        {
            "compliant_result": "PC",
            "Score": 75,
            "Remarks": "The document does not include evidence for Section 4. It also lacks proper citations for referenced standards. To achieve full compliance, add supporting evidence for Section 4 and include citations for the referenced standards."
        }
    `;
  // what the things are completed, 

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: query },
      ],
    });

    const completion = response.choices[0].message.content.trim(); // Trim to remove extra spaces or newlines

    try {
      const parsedResult = JSON.parse(completion); // Attempt to parse the JSON
      res.json({ result: parsedResult });
    } catch (error) {
      res.status(500).json({ error: "Invalid JSON format in AI response", details: completion });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
