export class TransformService {
  static apply(
    payload: Record<string, unknown>,
    transformRaw: string | null,
  ): Record<string, unknown> {
    if (!transformRaw) {
      return payload;
    }

    let transform: {
      rename?: Record<string, string>;
      remove?: string[];
      static?: Record<string, unknown>;
      template?: Record<string, string>;
    };

    try {
      transform = JSON.parse(transformRaw);
    } catch {
      return payload;
    }

    let result = { ...payload };

    // 1. Rename keys
    if (transform.rename) {
      for (const [oldKey, newKey] of Object.entries(transform.rename)) {
        if (oldKey in result) {
          result[newKey] = result[oldKey];
          delete result[oldKey];
        }
      }
    }

    // 2. Remove keys
    if (transform.remove) {
      for (const key of transform.remove) {
        delete result[key];
      }
    }

    // 3. Add static keys
    if (transform.static) {
      result = { ...result, ...transform.static };
    }

    // 4. Template (restructure with dot-path nesting)
    if (transform.template) {
      const templated: Record<string, unknown> = {};
      for (const [targetPath, sourceKey] of Object.entries(
        transform.template,
      )) {
        const value = payload[sourceKey];
        if (value !== undefined) {
          setNestedValue(templated, targetPath, value);
        }
      }
      // Merge templated structure into result
      result = deepMerge(result, templated);
    }

    return result;
  }
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      result[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
