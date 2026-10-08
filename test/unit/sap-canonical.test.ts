import { test, expect } from "vitest";
import { parse } from "yaml";
import { canonicalize, fingerprint, packageFingerprint } from "../../src/sap/canonical.js";

// golden vectors 期望值按 PRD「规范化序列化」段 + GRILL Q4 规则手工推导，不来自实现输出

test("golden: 纯 ASCII 对象字面量", () => {
  const v = {
    name: "gmv",
    type: "simple",
    owner: "data-team",
    tags: ["a", "b1"],
    count: 3,
    ratio: 0.5,
    active: true,
    note: null
  };
  expect(canonicalize(v)).toBe(
    [
      "active: true",
      "count: 3",
      "name: gmv",
      "note: null",
      "owner: data-team",
      "ratio: 0.5",
      "tags:",
      "  - a",
      "  - b1",
      "type: simple",
      ""
    ].join("\n")
  );
});

test("golden: 含中文 definition 与 emoji", () => {
  const v = {
    definition: "总成交额，含退款",
    emoji: "📈 ok",
    note: "GMV"
  };
  expect(canonicalize(v)).toBe(
    ['definition: "总成交额，含退款"', 'emoji: "📈 ok"', 'note: "GMV"', ""].join("\n")
  );
});

test("golden: 深嵌套 caliber_switches + 概念引用数组", () => {
  const v = {
    metrics: [
      {
        name: "gmv",
        caliber_switches: {
          refund: { include: true },
          gross: { include: false }
        },
        caliber_type: ["refund_adjustment", "fee_composition"],
        statistic_object: {
          id: "order",
          version: "1.0.0",
          source: "protege:snapshot/order@1.0.0",
          role: "statistic_object"
        }
      }
    ]
  };
  expect(canonicalize(v)).toBe(
    [
      "metrics:",
      "  - caliber_switches:",
      "      gross:",
      "        include: false",
      "      refund:",
      "        include: true",
      "    caliber_type:",
      "      - refund_adjustment",
      "      - fee_composition",
      "    name: gmv",
      "    statistic_object:",
      "      id: order",
      '      role: statistic_object',
      '      source: "protege:snapshot/order@1.0.0"',
      "      version: 1.0.0",
      ""
    ].join("\n")
  );
});

test("round-trip: yaml.parse(canonicalize(v)) 语义等价原值", () => {
  const v = {
    metrics: [
      {
        name: "gmv",
        definition: "支付成功订单的金额合计",
        score: 0.75,
        active: true,
        review: null,
        tags: ["电商", "📈"],
        nested: [[1, 2], [{ a: "x" }]],
        empty_arr: [],
        empty_obj: {}
      }
    ]
  };
  expect(parse(canonicalize(v))).toEqual(v);
});

test("round-trip: 三次 canonicalize 哈希恒定", () => {
  const v = { b: { d: ["x", 1.5, false, null], a: "中文" }, a: "leaf-1" };
  const h1 = fingerprint(canonicalize(v));
  const h2 = fingerprint(canonicalize(JSON.parse(JSON.stringify(v))));
  const h3 = fingerprint(canonicalize(v));
  expect(h1).toBe(h2);
  expect(h1).toBe(h3);
  expect(h1).toMatch(/^sha256:[0-9a-f]{64}$/);
});

test("引号规则: plain-safe 命中保持 plain", () => {
  for (const s of ["abc", "a-b_c/d.e0", "9lives", "order_1", "v0.1.0"]) {
    expect(canonicalize(s)).toBe(`${s}\n`);
  }
});

test("引号规则: core-schema 非串类型冲突串强制双引号", () => {
  // 这些串均匹配 plain-safe 正则，但命中 YAML 1.2 core schema 的 null/bool/int/float
  for (const s of ["true", "false", "null", "123", "1.5", "1e5", "0", "007"]) {
    expect(canonicalize(s)).toBe(`"${s}"\n`);
  }
  // 不匹配 plain-safe 正则的同样强制双引号
  for (const s of ["~", "True", "NULL", "0x1f", "0o17", ".inf", "GMV", ""]) {
    expect(canonicalize(s)).toBe(`"${s}"\n`);
  }
});

test("引号规则: 双引号 + JSON 转义", () => {
  expect(canonicalize('a"b\\c\nd\te')).toBe('"a\\"b\\\\c\\nd\\te"\n');
  expect(canonicalize("x\u0001y")).toBe('"x\\u0001y"\n');
});

test("NFC: NFD 与 NFC 输入产出同字节", () => {
  const nfc = "café";
  const nfd = "café"; // e + U+0301 组合符
  expect(nfd).not.toBe(nfc);
  expect(canonicalize(nfd)).toBe(canonicalize(nfc));
  expect(canonicalize(nfd)).toBe(`"${nfc}"\n`);
});

test("边界: 空集合退化与 undefined/null 处理", () => {
  expect(canonicalize([])).toBe("[]\n");
  expect(canonicalize({})).toBe("{}\n");
  expect(canonicalize({ a: [], b: {}, c: undefined })).toBe("a: []\nb: {}\nc: null\n");
});

test("边界: 非有限数拒绝（fail-closed）", () => {
  expect(() => canonicalize(Number.NaN)).toThrow(RangeError);
  expect(() => canonicalize(Number.POSITIVE_INFINITY)).toThrow(RangeError);
});

function makePkg(overrides: Record<string, unknown> = {}) {
  return {
    sap: "0.1",
    package: {
      id: "ecommerce",
      version: "0.1.0",
      kind: "instance",
      created_at: "2026-10-08T00:00:00.000Z",
      generator: "metric-factory@0.1.0+abc123",
      fingerprint: ""
    },
    scenarios: [],
    metrics: [{ name: "gmv" }],
    dimensions: ["channel"],
    concept_refs: [],
    bindings: [],
    review: { gate: "metric-factory-export-gate", exported_at: "2026-10-08T00:00:00.000Z", unreviewed: [] },
    runtime_state: "design_only",
    ...overrides
  };
}

test("指纹自引用: 同一对象两次计算恒等，声明值=计算值", () => {
  const pkg = makePkg();
  const fp1 = packageFingerprint(pkg);
  const fp2 = packageFingerprint(pkg);
  expect(fp1).toBe(fp2);
  expect(fp1).toMatch(/^sha256:[0-9a-f]{64}$/);
  // 声明值写回后重算仍恒等（fingerprint 字段置空后计算）
  const declared = makePkg({ package: { ...pkg.package, fingerprint: fp1 } });
  expect(packageFingerprint(declared)).toBe(fp1);
});

test("指纹自引用: fingerprint 字段外任意内容改动哈希必变，仅改字段不变", () => {
  const base = makePkg();
  const fp = packageFingerprint(base);
  const changedContent = makePkg({ metrics: [{ name: "mrr" }] });
  expect(packageFingerprint(changedContent)).not.toBe(fp);
  const changedField = makePkg({ package: { ...base.package, fingerprint: "sha256:deadbeef" } });
  expect(packageFingerprint(changedField)).toBe(fp);
});
