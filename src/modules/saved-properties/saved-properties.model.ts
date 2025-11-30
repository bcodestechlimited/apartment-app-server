import mongoose, { Schema, Document } from "mongoose";
import type { ISavedProperties } from "./saved-properties.interface";

const SavedPropertiesSchema = new Schema<ISavedProperties>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  property: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

const SavedProperties = mongoose.model<ISavedProperties>(
  "SavedProperties",
  SavedPropertiesSchema
);

export default SavedProperties;
