import { ApiError, ApiSuccess } from "@/utils/responseHandler.js";
import type { IQueryParams } from "../../shared/interfaces/query.interface.js";
import { paginate } from "../../utils/paginate.js";
import Tenant from "./tenant.model.js";
import type { createTenantDTO } from "./tenant.interface.js";
import type { ObjectId, Types } from "mongoose";

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

  static async getLandlordTenants(
    landlordId: string | Types.ObjectId,
    query: IQueryParams
  ) {
    const { page, limit } = query;
    const filterQuery = { landlord: landlordId };

    const sort = { createdAt: -1 };
    const populateOptions = [
      { path: "landlord", select: "firstName lastName email" },
      { path: "user", select: "firstName lastName email avatar phoneNumber" },
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
}

export const tenantService = new TenantService();
