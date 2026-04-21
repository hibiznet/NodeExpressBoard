function idsEqual(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

module.exports = { idsEqual };
