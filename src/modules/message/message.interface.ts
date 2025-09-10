import { Document, Types, type ObjectId } from "mongoose";
import type { IUser } from "../user/user.interface";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  isRead: boolean;
  deletedFor: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: string;
  lastSender?: IUser | string | ObjectId;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}
