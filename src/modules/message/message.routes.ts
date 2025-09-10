import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { MessageController } from "./message.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { MessageSchemas } from "./message.schema.js";

const router = express.Router();

// Send a message
router
  .route("/")
  .post(
    isAuth,
    validateBody(MessageSchemas.createMessageSchema),
    MessageController.sendMessage
  )
  .all(methodNotAllowed);

// Get or start a conversation
router
  .route("/conversation")
  .get(isAuth, MessageController.getConversations)
  .post(
    isAuth,
    validateBody(MessageSchemas.createConversationSchema),
    MessageController.getOrCreateConversation
  )
  .all(methodNotAllowed);

// Get a specific conversation
router
  .route("/conversation/:conversationId")
  .get(isAuth, MessageController.getConversation)
  .all(methodNotAllowed);

// Get messages in a specific conversation
router
  .route("/conversation/:conversationId/messages")
  .get(isAuth, MessageController.getMessages)
  .all(methodNotAllowed);

export default router;
