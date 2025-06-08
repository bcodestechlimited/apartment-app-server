import mongoose, { Schema } from "mongoose";
import type { IUser } from "./user.interface";

const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      // required: [true, "Please provide a username"],
    },
    lastName: {
      type: String,
      trim: true,
      // required: [true, "Please provide a last name"],
    },
    avatar: {
      type: String,
      trim: true,
      default: "https://github.com/shadcn.png",
    },
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email address",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [5, "Password must be at least 5 characters long"],
      select: false,
    },
    documents: {
      type: [
        {
          type: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    preferences: {
      type: [String],
      default: [],
    },
    phoneNumber: {
      type: String,
      // required: [true, "Please provide a phone number"],
      // match: [
      //   /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
      //   "Please enter a valid Nigerian phone number",
      // ],
    },
    roles: {
      type: [String],
      enum: ["user", "landlord", "tenant", "admin"],
      default: ["user"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
