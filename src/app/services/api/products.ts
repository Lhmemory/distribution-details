import { ProductRecord } from "../../types";
import { simulateRequest } from "./client";

export const productApi = {
  list: async (records: ProductRecord[]) => simulateRequest(records),
};
