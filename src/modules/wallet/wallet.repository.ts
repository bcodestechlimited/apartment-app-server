import Wallet from "./wallet.model";
import type { IWallet } from "./wallet.interface";
import type { FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export class WalletRepository {
  async create(data: Partial<IWallet>): Promise<IWallet> {
    return await Wallet.create(data);
  }

  async findOne(filter: FilterQuery<IWallet>): Promise<IWallet | null> {
    return await Wallet.findOne(filter).exec();
  }

  async find(
    filter: FilterQuery<IWallet>,
    options?: QueryOptions,
  ): Promise<IWallet[]> {
    return await Wallet.find(filter, null, options).exec();
  }

  async update(
    filter: FilterQuery<IWallet>,
    data: UpdateQuery<IWallet>,
  ): Promise<IWallet | null> {
    return await Wallet.findOneAndUpdate(filter, data, { new: true }).exec();
  }

  async delete(filter: FilterQuery<IWallet>): Promise<IWallet | null> {
    return await Wallet.findOneAndDelete(filter).exec();
  }

  async count(filter: FilterQuery<IWallet>): Promise<number> {
    return await Wallet.countDocuments(filter).exec();
  }
}
