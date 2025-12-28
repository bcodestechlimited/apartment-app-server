import mongoose, { Schema, Document } from "mongoose";

export interface IFavourite extends Document {
  user: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
}

const FavouriteSchema = new Schema<IFavourite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  },
  { timestamps: true }
);

const Favourite = mongoose.model<IFavourite>("Favourite", FavouriteSchema);

export default Favourite;
