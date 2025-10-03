import { z } from "zod";
import mongoose from "mongoose";

export class MessageSchemas {
  static createMessageSchema = z.object({
    conversationId: z
      .string({
        required_error: "Conversation ID is required",
        invalid_type_error: "Conversation ID must be a valid MongoDB ObjectId",
      })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid conversation ID",
      }),

    sender: z
      .string({ required_error: "Sender ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sender ID",
      }),

    receiver: z
      .string({ required_error: "Receiver ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid receiver ID",
      }),

    content: z
      .string({ required_error: "Message content is required" })
      .min(1, "Message content cannot be empty"),
  });

  static createConversationSchema = z.object({
    receiverId: z
      .string({ required_error: "Receiver ID is required" })
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid receiver ID",
      }),
    isGroup: z.boolean().optional(),
  });
}
