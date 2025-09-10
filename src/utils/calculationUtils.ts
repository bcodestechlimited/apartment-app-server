import { ApiError } from "./responseHandler";

export function calculateBookingPeriod(
  moveInDate: Date | string,
  pricingModel: string
) {
  const start = new Date(moveInDate);

  if (Number.isNaN(start.getTime())) {
    throw ApiError.badRequest("Invalid move-in date");
  }

  const end = new Date(start);

  switch (pricingModel) {
    case "hourly":
      end.setHours(end.getHours() + 1);
      break;
    case "daily":
      end.setDate(end.getDate() + 1);
      break;
    case "weekly":
      end.setDate(end.getDate() + 7);
      break;
    case "monthly":
      end.setMonth(end.getMonth() + 1);
      break;
    case "yearly":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default: {
      const _exhaustive: string = pricingModel;
      throw ApiError.badRequest(`Unsupported pricing model: ${_exhaustive}`);
    }
  }

  return {
    startDate: start,
    endDate: end,
    durationMs: end.getTime() - start.getTime(),
  };
}

export function toISODate(input: string): string | null {
  const parts = input.split("-");
  if (parts.length !== 3) return null;

  const [month, day, year] = parts;
  if (!month || !day || !year) return null;

  const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(isoDate);

  return isNaN(parsed.getTime()) ? null : isoDate;
}
