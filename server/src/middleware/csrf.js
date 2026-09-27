// Double-submit CSRF: exige header x-csrf-token igual ao cookie `csrf`
// apenas quando a autenticação veio via cookie (Bearer é imune a CSRF).
// Métodos seguros (GET/HEAD/OPTIONS) nunca exigem.
function csrf(req, res, next) {
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();
  const hasBearer = String(req.get("authorization") || "").startsWith("Bearer ");
  if (hasBearer) return next();
  const hasSession = Boolean(req.cookies?.session || req.cookies?.["__Host-session"]);
  if (!hasSession) return next();
  const headerToken = req.get("x-csrf-token");
  const cookieToken = req.cookies?.csrf;
  if (headerToken && cookieToken && headerToken === cookieToken) return next();
  return res.status(403).json({ message: "Token CSRF inválido." });
}

module.exports = csrf;
