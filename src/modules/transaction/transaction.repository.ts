import Transaction from "./transaction.model";
import type { ITransaction } from "./transaction.interface";
import type { FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export class TransactionRepository {
  static async create(data: Partial<ITransaction>): Promise<ITransaction> {
    return await Transaction.create(data);
  }

  static async findOne(
    filter: FilterQuery<ITransaction>,
  ): Promise<ITransaction | null> {
    return await Transaction.findOne(filter).exec();
  }

  static async find(
    filter: FilterQuery<ITransaction>,
    options?: QueryOptions,
  ): Promise<ITransaction[]> {
    return await Transaction.find(filter, null, options).exec();
  }

  static async update(
    filter: FilterQuery<ITransaction>,
    data: UpdateQuery<ITransaction>,
  ): Promise<ITransaction | null> {
    return await Transaction.findOneAndUpdate(filter, data, {
      new: true,
    }).exec();
  }

  static async delete(
    filter: FilterQuery<ITransaction>,
  ): Promise<ITransaction | null> {
    return await Transaction.findOneAndDelete(filter).exec();
  }

  static async count(filter: FilterQuery<ITransaction>): Promise<number> {
    return await Transaction.countDocuments(filter).exec();
  }
}
