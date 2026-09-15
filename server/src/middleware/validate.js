function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: "Dados inválidos.",
        issues: result.error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
      });
    }
    if (source === "query") {
      Object.defineProperty(req, "query", { value: result.data, configurable: true });
    } else {
      req[source] = result.data;
    }
    return next();
  };
}

module.exports = validate;
