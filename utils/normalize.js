function normalizeBigInt(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'bigint') {
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    const min = BigInt(Number.MIN_SAFE_INTEGER);
    if (value <= max && value >= min) {
      return Number(value);
    }
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeBigInt);
  }

  if (value && typeof value === 'object') {
    const normalized = {};
    for (const [key, item] of Object.entries(value)) {
      normalized[key] = normalizeBigInt(item);
    }
    return normalized;
  }

  return value;
}

function normalizeSessionUser(user) {
  if (!user || typeof user !== 'object') return null;

  return {
    id: user.id == null ? null : String(normalizeBigInt(user.id)),
    email: user.email || null,
    name: user.name || null,
    role: user.role || 'USER'
  };
}

module.exports = {
  normalizeBigInt,
  normalizeSessionUser
};
