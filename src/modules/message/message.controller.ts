import type { Request, Response } from "express";
import { MessageService } from "./message.service";
import type { AuthenticatedUser } from "../user/user.interface";

export class MessageController {
  // Send a message in a conversation
  static async sendMessage(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { conversationId, content } = req.body;

    const result = await MessageService.sendMessage({
      senderId: userId,
      conversationId,
      content,
    });

    res.status(201).json(result);
  }

  // Get all messages in a conversation
  static async getMessages(req: Request, res: Response) {
    const { conversationId } = req.params;
    const result = await MessageService.getConversationMessages(
      conversationId as string
    );
    res.status(200).json(result);
  }

  // Get a conversation by ID
  static async getConversation(req: Request, res: Response) {
    const { conversationId } = req.params;
    const result = await MessageService.getConversationById(
      conversationId as string
    );
    res.status(200).json(result);
  }

  // Get or create a conversation between two users
  static async getOrCreateConversation(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { receiverId } = req.body;

    const result = await MessageService.getOrCreateConversation(
      userId,
      receiverId
    );
    res.status(200).json(result);
  }

  // Get all conversations for a user
  static async getConversations(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await MessageService.getUserConversations(userId);
    res.status(200).json(result);
  }
}
