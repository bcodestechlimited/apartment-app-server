import Property from "./property.model.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import type {
  CreatePropertyDTO,
  UpdatePropertyDTO,
} from "./property.interface.js";
import type { ObjectId } from "mongoose";
import { UploadService } from "../../services/upload.service.js";
import type { UploadedFile } from "express-fileupload";
import fs from "fs";
import cloudinary from "../../lib/cloudinary.js";
import path from "path";

export class PropertyService {
  static async getPropertyDocumentById(propertyId: string | ObjectId) {
    const property = await Property.findOne({ _id: propertyId }).populate(
      "user",
      "-password"
    );
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return property;
  }
  // Create new property
  static async createProperty(
    propertyData: CreatePropertyDTO,
    files: any,
    userId: ObjectId
  ) {
    const { pictures } = files;
    const property = new Property({ ...propertyData, user: userId });

    const uploadedPictures = await Promise.all(
      pictures.map(async (picture: UploadedFile) => {
        console.log("Cloudinary config:", cloudinary.config());
        console.log("Uploading file:", {
          path: picture.tempFilePath,
          size: fs.statSync(picture.tempFilePath).size,
          name: picture.name,
        });

        const { secure_url } = await UploadService.uploadToCloudinary(
          // picture.tempFilePath
          pictures[0].tempFilePath
        );
        console.log({ secure_url });
        return secure_url;
      })
    );

    property.pictures = uploadedPictures as string[];
    await property.save();
    return ApiSuccess.created("Property created successfully", { property });
  }
  // static async createProperty(
  //   propertyData: CreatePropertyDTO,
  //   files: any,
  //   userId: ObjectId
  // ) {
  //   const { pictures } = files;
  //   const property = new Property({ ...propertyData, user: userId });

  //   const tempDir = path.resolve(__dirname, "../temp");
  //   if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  //   const uploadedPictures: string[] = [];
  //   const tempPaths: string[] = [];

  //   // Step 1: Save each uploaded picture to temp folder
  //   for (const picture of pictures) {
  //     const timestamp = Date.now();
  //     const safeName = picture.name.replace(/\s+/g, "_"); // remove spaces
  //     const tempFileName = `${timestamp}-${safeName}`;
  //     const tempPath = path.join(tempDir, tempFileName);

  //     await picture.mv(tempPath); // save file to temp dir
  //     tempPaths.push(tempPath);
  //   }

  //   // Step 2: Upload to Cloudinary one by one
  //   for (const tempPath of tempPaths) {
  //     console.log({ tempPath });

  //     const { secure_url } = await UploadService.uploadToCloudinary(tempPath);

  //     console.log({ secure_url });

  //     uploadedPictures.push(secure_url as string);
  //   }

  //   // Step 3: Delete temp files
  //   for (const tempPath of tempPaths) {
  //     fs.unlinkSync(tempPath);
  //   }

  //   // Step 4: Save property with uploaded picture URLs
  //   property.pictures = uploadedPictures;
  //   await property.save();

  //   return ApiSuccess.created("Property created successfully", { property });
  // }

  // Get all properties
  static async getAllProperties() {
    const properties = await Property.find().populate("user", "-password");
    return ApiSuccess.ok("Properties retrieved successfully", { properties });
  }

  // Get single property by ID
  static async getPropertyById(id: string) {
    console.log({ id });

    const property = await Property.findById(id).populate("user", "-password");
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    return ApiSuccess.ok("Property retrieved successfully", { property });
  }

  // Update property
  static async updateProperty(
    id: string,
    updateData: UpdatePropertyDTO,
    userId: ObjectId
  ) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    // Optionally enforce ownership
    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to update this property"
      );
    }

    Object.assign(property, updateData);
    await property.save();

    return ApiSuccess.ok("Property updated successfully", { property });
  }

  // Delete property
  static async deleteProperty(id: string, userId: ObjectId) {
    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound("Property not found");
    }

    if (property.user.toString() !== userId.toString()) {
      throw ApiError.forbidden(
        "You do not have permission to delete this property"
      );
    }

    await property.deleteOne();

    return ApiSuccess.ok("Property deleted successfully");
  }
}

export const propertyService = new PropertyService();
