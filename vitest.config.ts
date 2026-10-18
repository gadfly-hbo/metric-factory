import { defineConfig } from "vitest/config";

// 进程边界 e2e（dist CLI 子进程）在 node 22 / CI 冷启动下会越过 vitest 5s 默认超时
// （REVIEW F1：new-templates / receipt e2e 在 node 22 全量套件中稳定超时、单跑即过）。
// 15s 只放宽挂死守卫，行为断言不变；单元测试为毫秒级，不受影响。
export default defineConfig({
  test: {
    testTimeout: 15_000
  }
});
