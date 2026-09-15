import { describe, it } from "node:test";
import assert from "node:assert/strict";
import dayjs from "dayjs";
import { getDateRange } from "./dateRanges.js";

describe("getDateRange", () => {
  const now = dayjs("2026-09-14");

  it("gera o período do dia", () => {
    assert.deepEqual(getDateRange("hoje", "", "", now), {
      dataInicio: "2026-09-14",
      dataFim: "2026-09-14",
    });
  });

  it("mantém o período personalizado", () => {
    assert.deepEqual(getDateRange("personalizado", "2026-09-01", "2026-09-10", now), {
      dataInicio: "2026-09-01",
      dataFim: "2026-09-10",
    });
  });

  it("não monta consulta personalizada sem Aplicar", () => {
    assert.deepEqual(getDateRange("personalizado", "", "", now), {});
  });
});
