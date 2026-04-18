import { UserAccount } from "../../types";
import { simulateRequest } from "./client";

export const userApi = {
  list: async (records: UserAccount[]) => simulateRequest(records),
};
