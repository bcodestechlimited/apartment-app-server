import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";
import Conversation, { Message } from "../modules/message/message.model";

let io: SocketIOServer;

interface OnlineUser {
  socketId: string;
  userId: string;
}

let onlineUsers: OnlineUser[] = [];

const handleAddNewUser = (
  io: SocketIOServer,
  socket: Socket,
  user: { userId: string }
) => {
  const isUserOnline = onlineUsers.some(
    (onlineUser) => onlineUser.userId === user.userId
  );

  if (!isUserOnline) {
    onlineUsers.push({
      socketId: socket.id,
      userId: user.userId,
    });
  }

  console.log({ onlineUsers });

  io.emit("get_online_users", onlineUsers);
};

const handleSendMessage = async (
  io: SocketIOServer,
  socket: Socket,
  data: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
  }
) => {
  logger.info("Socket message", data);
  try {
    const { conversationId, senderId, receiverId, text } = data;

    const newMessage = new Message({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      content: text,
    });

    await newMessage.save();

    await newMessage.populate([
      {
        path: "sender",
        select: "firstName lastName avatar",
      },
      {
        path: "receiver",
        select: "firstName lastName avatar",
      },
    ]);
    // Update conversation with last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastSender: senderId,
    });

    const user = onlineUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).to(socket.id).emit("receive_message", newMessage);
      logger.info("Message delivered successfully");
    }

    // io.to(conversationId).emit("receive_message", newMessage);
  } catch (error) {
    logger.error(error);
    logger.error("Socket message error", error);
  }
};

const handleUserTyping = (
  io: SocketIOServer,
  socket: Socket,
  data: { isTyping: string; recipientId: string }
) => {
  const user = onlineUsers.find((user) => user.userId === data.recipientId);

  if (user) {
    io.to(user.socketId).emit("receive_typing_status", data);
  }
};

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`🧠 New client connected: ${socket.id}`);
    logger.info({ onlineUsers });

    socket.on("add_online_user", (user: { userId: string }) => {
      handleAddNewUser(io, socket, user);
    });

    socket.on("send_message", (data) => {
      handleSendMessage(io, socket, data);
    });

    socket.on("send_typing_status", (data) => {
      handleUserTyping(io, socket, data);
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};

export { io };
