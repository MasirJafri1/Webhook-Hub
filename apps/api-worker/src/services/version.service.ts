export class VersionService {
  static format(
    payload: Record<string, unknown>,
    version: string | null,
  ): Record<string, unknown> {
    switch (version) {
      case "v2":
        return {
          data: payload,
          version: "v2",
          timestamp: new Date().toISOString(),
        };
      case "v1":
      default:
        return payload;
    }
  }
}
