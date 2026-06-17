import { Schema, model, models, type InferSchemaType } from "mongoose";

const chatMessageSchema = new Schema(
  {
    role: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    walletAddress: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema>;

export const ChatMessageModel = models.ChatMessage || model("ChatMessage", chatMessageSchema);
