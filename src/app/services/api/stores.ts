import { StoreRecord } from "../../types";
import { simulateRequest } from "./client";

export const storeApi = {
  list: async (records: StoreRecord[]) => simulateRequest(records),
};
