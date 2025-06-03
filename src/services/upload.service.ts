import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../lib/cloudinary";

export class UploadService {
  static async uploadToCloudinary(
    tempFilePath: string
  ): Promise<Partial<UploadApiResponse>> {
    try {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        tempFilePath,
        {
          use_filename: true,
          folder: "apartment-app",
          resource_type: "auto",
        }
      );
      return { secure_url, public_id };
    } catch (error) {
      console.log(`Error uploading to cloudinary`, { error });
      throw error;
    }
  }
}
