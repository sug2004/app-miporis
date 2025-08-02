import mongoose from 'mongoose';

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
    "Relevance": {
        type: String,
        default: 'Y'
    },
    "Compliance": {
        type: String,
        default: 'N'
    },
    "compliant_type": String,
    "userId": String,
    "compliant_result": {
        type: String,
        enum: ['C', 'PC', 'WE' ,'NC'],
        default: 'NC',
        required: true
    },
    "score": {
        type: Number,
        default: 0
    },
    "uploadHistory": {
        type: [
            new mongoose.Schema(
                {
                    score: { type: Number },
                    remark: { type: String },
                    files: [
                        {
                            fileName: { type: String },
                            fileUrl: { type: String },
                        }
                    ]
                },
                { _id: false }
            )
        ],
        default: []
    },
    "updatedAt": {
        type: Number,
    },
});

// ✅ Automatically set score to 100 if Compliance is "Y"
controlDataSchema.pre('save', function (next) {
    if (this.Compliance === 'Y') {
        this.score = 100;
    }
    next();
});

const ControlData = mongoose.models.controldatas || mongoose.model('controldatas', controlDataSchema);

export default ControlData;
