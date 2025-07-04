import type { Request, Response } from "express";
import { PropertyService } from "./property.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";

export class PropertyController {
  // Create new property
  static async createProperty(req: Request, res: Response) {
    const propertyData = req.body;
    const files = req.files;
    const { userId } = req.user as AuthenticatedUser;
    const result = await PropertyService.createProperty(
      propertyData,
      files,
      userId
    );
    res.status(201).json(result);
  }

  // Get all properties
  static async getAllProperties(req: Request, res: Response) {
    const query = req.query as IQueryParams;
    const result = await PropertyService.getAllProperties(query);
    res.status(200).json(result);
  }

  static async getAllLandlordProperties(req: Request, res: Response) {
    const query = req.query as IQueryParams;
    const { userId } = req.user as AuthenticatedUser;
    const result = await PropertyService.getLandlordProperties(userId, query);
    res.status(200).json(result);
  }

  // Get a single property by ID
  static async getPropertyById(req: Request, res: Response) {
    const { propertyId } = req.params;
    const result = await PropertyService.getPropertyById(propertyId as string);
    res.status(200).json(result);
  }

  // Update a property
  static async updateProperty(req: Request, res: Response) {
    const { propertyId } = req.params;
    const propertyData = req.body;
    const { userId } = req.user as AuthenticatedUser;
    const result = await PropertyService.updateProperty(
      propertyId as string,
      propertyData,
      userId
    );
    res.status(200).json(result);
  }

  // Delete a property
  static async deleteProperty(req: Request, res: Response) {
    const { propertyId } = req.params;
    const { userId } = req.user as AuthenticatedUser;
    const result = await PropertyService.deleteProperty(
      propertyId as string,
      userId
    );
    res.status(200).json(result);
  }
}
