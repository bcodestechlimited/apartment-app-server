import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type { ICreateReport } from "./report.interface";
import Report from "./report.model";
import UserService from "../user/user.service";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import { paginate } from "@/utils/paginate";
import type { Types } from "mongoose";

export class ReportService {
  static async createReport(
    data: ICreateReport,
    userId: string | Types.ObjectId
  ) {
    const existingReportedUser = await UserService.findUserById(
      data.reportedUser as string
    );
    if (!existingReportedUser) {
      throw ApiError.notFound(
        "The user you are trying to report does not exist."
      );
    }
    const report = new Report({
      ...data,
      reporter: userId,
    });
    await report.save();
    return ApiSuccess.created("Report created successfully", { report });
  }

  static async getReports(query: IQueryParams) {
    const { page, limit, search, status } = query;
    const filterQuery: Record<string, any> = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filterQuery.$or = [{ reason: searchRegex }, { description: searchRegex }];
    }

    if (status) {
      filterQuery.status = status;
    }

    const sort = { createdAt: -1 };
    const populateOptions = [{ path: "reporter" }, { path: "reportedUser" }];

    const { documents: reports, pagination } = await paginate({
      model: Report,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return {
      reports,
      pagination,
    };
  }

  static async getReport(reportedUser: string, query: IQueryParams) {
    const { page, limit, search, status } = query;
    const filterQuery: Record<string, any> = { reportedUser };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filterQuery.$or = [{ reason: searchRegex }, { description: searchRegex }];
    }

    if (status) {
      filterQuery.status = status;
    }
    const sort = { createdAt: -1 };
    const populateOptions = [{ path: "reporter" }, { path: "reportedUser" }];

    const { documents: reports, pagination } = await paginate({
      model: Report,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return {
      reports,
      pagination,
    };
  }
}
