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
    participants: z
      .array(
        z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: "Each participant must be a valid ObjectId",
        })
      )
      .min(2, "A conversation must have at least two participants"),
    isGroup: z.boolean().optional(),
  });
}
