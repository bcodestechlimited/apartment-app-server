import { ApiError, ApiSuccess } from "@/utils/responseHandler.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import { paginate } from "../../utils/paginate.js";
import Tenant from "./tenant.model.js";
import type { createTenantDTO } from "./tenant.interface.js";
import type { ObjectId, Types } from "mongoose";
import mongoose from "mongoose";

export class TenantService {
  static async createTenant(payload: createTenantDTO) {
    const tenant = await Tenant.create({
      user: payload.user,
      landlord: payload.landlord,
      property: payload.property,
      moveInDate: payload.moveInDate,
      endDate: payload.endDate || null,
      isActive: true,
    });

    return ApiSuccess.created("Tenant created successfully", { tenant });
  }

  static async getAllTenants(query: IQueryParams) {
    const { page, limit, search } = query;
    const filterQuery: Record<string, any> = {};

    // if (search) {
    //   filterQuery.$or = [
    //     { "user.firstName": { $regex: search, $options: "i" } },
    //     { "user.lastName": { $regex: search, $options: "i" } },
    //     { "user.email": { $regex: search, $options: "i" } },
    //   ];
    // }

    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "landlord" },
      { path: "user" },
      { path: "property" },
    ];

    const { documents: tenants, pagination } = await paginate({
      model: Tenant,
      query: filterQuery,
      page,
      limit,
      sort: sort,
      populateOptions,
    });

    return ApiSuccess.ok("Tenants retrieved successfully", {
      tenants,
      pagination,
    });
  }

  // static async getLandlordTenants(
  //   landlordId: Types.ObjectId,
  //   query: IQueryParams
  // ) {
  //   const { page, limit } = query;
  //   const filterQuery = { landlord: landlordId };

  //   const sort = { createdAt: -1 };
  //   const populateOptions = [
  //     { path: "landlord", select: "firstName lastName email" },
  //     {
  //       path: "user",
  //       select:
  //         "firstName lastName email avatar phoneNumber isDocumentVerified totalRatings  averageRating",
  //     },
  //     { path: "property" },
  //   ];

  //   const { documents: tenants, pagination } = await paginate({
  //     model: Tenant,
  //     query: filterQuery,
  //     page,
  //     limit,
  //     sort: sort,
  //     populateOptions,
  //   });

  //   return ApiSuccess.ok("Tenants retrieved successfully", {
  //     tenants,
  //     pagination,
  //   });
  // }

  static async getLandlordTenants(
    landlordId: Types.ObjectId | string, // Changed from Types.ObjectId to string for safety, or keep as is
    query: IQueryParams & { filter?: string }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filterOption = query.filter || "";

    const landlordObjectId = new mongoose.Types.ObjectId(landlordId);

    // 1. Base Match: Find tenants belonging to this landlord
    const pipeline: any[] = [{ $match: { landlord: landlordObjectId } }];

    // 2. Lookups: Join User and Property data so we can filter/sort by them
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // Flatten user array
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" } // Flatten property array
    );

    // 3. Apply Dynamic Filters based on dropdown selection
    if (filterOption === "current") {
      pipeline.push({ $match: { isActive: true } });
    } else if (filterOption === "past") {
      pipeline.push({ $match: { isActive: false } });
    }
    // Note: sorting options don't use $match, they use $sort below

    // 4. Apply Sorting
    let sortStage: any = { createdAt: -1 }; // Default: Newest first

    switch (filterOption) {
      case "property":
        // Sort by Property Title Alphabetically
        sortStage = { "property.title": 1 };
        break;
      case "verified":
        // Sort by Verified Users first
        sortStage = { "user.isDocumentVerified": -1 };
        break;
      case "status":
        // Sort by Active tenants first
        sortStage = { isActive: -1 };
        break;
      default:
        // Default sort is createdAt defined above
        break;
    }
    pipeline.push({ $sort: sortStage });

    // 5. Pagination Facet (Get data and total count in one query)
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    });

    // Execute Aggregation
    const result = await Tenant.aggregate(pipeline);

    // 6. Format Response
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      totalDocuments: total,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return ApiSuccess.ok("Tenants retrieved successfully", {
      tenants: data,
      pagination,
    });
  }

  static async totalActiveTenants() {
    const count = await Tenant.countDocuments({ isActive: true });
    return count;
  }

  static async totalTenantsCount() {
    const count = await Tenant.countDocuments();
    return count;
  }

  static async getTenantById(tenantId: string) {
    const populateOptions = [
      {
        path: "property",
      },
      {
        path: "tenant",
      },
      {
        path: "landlord",
      },
    ];

    const tenant = await Tenant.findById(tenantId).populate(populateOptions);

    if (!tenant) {
      throw ApiError.notFound("Tenant not found");
    }

    return ApiSuccess.ok("Tenant retrieved successfully", { tenant });
  }

  // Rate Tenant
  static async rateTenant(tenantId: string, rating: number) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw ApiError.notFound("Tenant not found");
    }

    await tenant.save();
    return ApiSuccess.ok("Tenant rated successfully", { tenant });
  }

  // Report Tenant
  static async reportTenant(tenantId: string, reason: string) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw ApiError.notFound("Tenant not found");
    }

    await tenant.save();
    return ApiSuccess.ok("Tenant reported successfully", { tenant });
  }

  // static async updateTenantStatus(userId: string, isActive: boolean) {
  //   const tenant = await Tenant.findOne({ user: userId });
  //   if (!tenant) {
  //     throw ApiError.notFound("Tenant not found");
  //   }

  //   tenant.isActive = isActive;
  //   await tenant.save();
  //   return ApiSuccess.ok("Tenant status updated successfully", { tenant });
  // }
}

export const tenantService = new TenantService();
