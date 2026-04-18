export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export async function simulateRequest<T>(data: T, timeout = 180): Promise<ApiEnvelope<T>> {
  await new Promise((resolve) => window.setTimeout(resolve, timeout));
  return { data };
}
