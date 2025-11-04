import { Message } from "./message.model";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import type { ObjectId, Types } from "mongoose";
import Conversation from "./message.model";

export class MessageService {
  // Fetch all conversations for a user
  static async getUserConversations(userId: string | Types.ObjectId) {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({ path: "participants", select: "firstName lastName avatar" })
      .sort({ updatedAt: -1 });

    return ApiSuccess.ok("Conversations retrieved successfully", {
      conversations,
    });
  }

  // Get messages in a specific conversation
  static async getConversationMessages(conversationId: string) {
    const messages = await Message.find({ conversationId: conversationId })
      .populate([
        {
          path: "sender",
          select: "firstName lastName avatar",
        },
        {
          path: "receiver",
          select: "firstName lastName avatar",
        },
      ])
      .sort({ createdAt: 1 });

    const conversation = await Conversation.findById(conversationId).populate([
      {
        path: "participants",
        select: "firstName lastName avatar",
      },
    ]);

    return ApiSuccess.ok("Messages retrieved successfully", {
      conversation,
      messages,
    });
  }

  // Get conversation by ID
  static async getConversationById(conversationId: string) {
    const conversation = await Conversation.findById(conversationId).populate([
      {
        path: "participants",
        select: "firstName lastName avatar",
      },
    ]);
    return ApiSuccess.ok("Conversation retrieved successfully", {
      conversation,
    });
  }

  // Send a message within a conversation
  static async sendMessage({
    senderId,
    conversationId,
    content,
  }: {
    senderId: Types.ObjectId | string;
    conversationId: string | ObjectId;
    content: string;
  }) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    const message = new Message({
      sender: senderId,
      conversation: conversationId,
      content,
    });

    await message.save();

    conversation.lastMessage = content;
    conversation.lastSender = senderId as string;
    conversation.updatedAt = new Date();

    await conversation.save();

    return ApiSuccess.created("Message sent successfully", { message });
  }

  // Start or get a conversation between two users
  static async getOrCreateConversation(
    user1: string | Types.ObjectId,
    user2: string | Types.ObjectId,
    content?: string
  ) {
    console.log({ user1, user2 });

    let conversation = await Conversation.findOne({
      participants: { $all: [user1, user2] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [user1, user2],
        lastMessage: content,
      });
      await conversation.save();
    }

    return ApiSuccess.ok("Conversation ready", { conversation });
  }
}

export const messageService = new MessageService();
