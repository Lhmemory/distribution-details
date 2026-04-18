import { SalesPeriodRecord } from "../../types";
import { simulateRequest } from "./client";

export const salesApi = {
  list: async (records: SalesPeriodRecord[]) => simulateRequest(records),
};
