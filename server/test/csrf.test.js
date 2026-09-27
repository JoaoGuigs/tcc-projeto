const test = require("node:test");
const assert = require("node:assert/strict");
const csrf = require("../src/middleware/csrf");

function mockReq({ method = "POST", cookies = {}, headers = {} } = {}) {
  const lower = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return {
    method,
    cookies,
    get: (name) => lower[String(name).toLowerCase()] || undefined,
  };
}

function runCsrf(req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; resolve({ next: false, res: this }); return this; },
    };
    csrf(req, res, () => resolve({ next: true, res }));
  });
}

test("csrf libera GET mesmo com cookie", async () => {
  const result = await runCsrf(mockReq({ method: "GET", cookies: { session: "x" } }));
  assert.equal(result.next, true);
});

test("csrf bloqueia POST com cookie sem token", async () => {
  const result = await runCsrf(mockReq({ method: "POST", cookies: { session: "x" } }));
  assert.equal(result.next, false);
  assert.equal(result.res.statusCode, 403);
});

test("csrf libera POST com cookie + header iguais", async () => {
  const result = await runCsrf(mockReq({
    method: "POST",
    cookies: { session: "x", csrf: "abc" },
    headers: { "x-csrf-token": "abc" },
  }));
  assert.equal(result.next, true);
});

test("csrf libera Bearer sem token csrf", async () => {
  const result = await runCsrf(mockReq({
    method: "POST",
    cookies: { session: "x" },
    headers: { authorization: "Bearer abc" },
  }));
  assert.equal(result.next, true);
});
