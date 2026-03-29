import { jwtDecode } from "jwt-decode";

export class DetectCloudbaseUserMiddleware {
  constructor(request) {
    this.request = request;
  }

  async beforeAgent({ input }) {
    const authorization =
      this.request?.headers?.authorization ||
      this.request?.headers?.Authorization ||
      this.request?.headers?.get?.("authorization") ||
      this.request?.headers?.get?.("Authorization") ||
      "";

    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return;
    }

    try {
      const payload = jwtDecode(token);
      input.forwardedProps = {
        ...(input.forwardedProps || {}),
        cloudbaseUserId:
          payload?.uid || payload?.sub || payload?.openid || payload?.user_id || "",
      };
    } catch (error) {
      console.warn("[DetectCloudbaseUserMiddleware] jwt decode failed", error?.message || error);
    }
  }
}
