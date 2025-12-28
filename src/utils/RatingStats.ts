export class RatingStatsHelper {
  static async update(entity: any, oldRating?: number, newRating?: number) {
    const avg = entity.averageRating || 0;
    const total = entity.totalRatings || 0;

    // CREATE: no oldRating, newRating exists
    if (!oldRating && newRating !== undefined) {
      const newTotal = total + 1;
      const newAvg = (avg * total + newRating) / newTotal;

      entity.averageRating = parseFloat(newAvg.toFixed(2));
      entity.totalRatings = newTotal;
    }

    // UPDATE: both oldRating & newRating exist
    else if (oldRating !== undefined && newRating !== undefined) {
      const newAvg = (avg * total - oldRating + newRating) / total;
      entity.averageRating = parseFloat(newAvg.toFixed(2));
    }

    // DELETE: oldRating exists, no newRating
    else if (oldRating && newRating === undefined) {
      if (total <= 1) {
        entity.averageRating = 0;
        entity.totalRatings = 0;
      } else {
        const newTotal = total - 1;
        const newAvg = (avg * total - oldRating) / newTotal;

        entity.averageRating = parseFloat(newAvg.toFixed(2));
        entity.totalRatings = newTotal;
      }
    }

    await entity.save();
  }
}
