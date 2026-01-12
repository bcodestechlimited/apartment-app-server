import mongoose, { Schema } from "mongoose";
import { type IConversation, type IMessage } from "./message.interface";

const MessageSchema: Schema<IMessage> = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedFor: {
      type: [Schema.Types.ObjectId], // soft delete per user
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
export const Message = mongoose.model<IMessage>("Message", MessageSchema);

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastSender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
export default Conversation;
