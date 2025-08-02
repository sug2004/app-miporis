import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    chatbotId: {
        type: String,
        required: true
    },
    controlType: {
        type: String,
        required: true
    },
    files: {
        type: [
            {
                fileName: { type: String },
                fileUrl: { type: String },
            }
        ],
        default: undefined
    },
    text: {
        type: String,
    },
    type: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
    },
});

const ChatHistory = mongoose.models.ChatHistories || mongoose.model('ChatHistories', chatHistorySchema);

export default ChatHistory;