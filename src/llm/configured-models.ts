/** Fixed configuration projected from pi-ai 0.87.1 metadata. See configured-models.md.
 * Data only: no provider execution, credential discovery or SDK implementation. */
import type {ModelConfig} from 'pi-agent-runtime';
export const configuredModels: Readonly<Record<string,ModelConfig>> = {
  "ant-ling/Ling-2.6-1T": {
    "provider": "ant-ling",
    "id": "Ling-2.6-1T",
    "protocol": "openai-completions",
    "endpoint": "https://api.ant-ling.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "ant-ling/Ling-2.6-flash": {
    "provider": "ant-ling",
    "id": "Ling-2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.ant-ling.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "ant-ling/Ring-2.6-1T": {
    "provider": "ant-ling",
    "id": "Ring-2.6-1T",
    "protocol": "openai-completions",
    "endpoint": "https://api.ant-ling.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "anthropic/claude-fable-5": {
    "provider": "anthropic",
    "id": "claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-fable-5-1": {
    "provider": "anthropic",
    "id": "claude-fable-5-1",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-haiku-4-5": {
    "provider": "anthropic",
    "id": "claude-haiku-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-haiku-4-5-20251001": {
    "provider": "anthropic",
    "id": "claude-haiku-4-5-20251001",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-opus-4-5": {
    "provider": "anthropic",
    "id": "claude-opus-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-opus-4-5-20251101": {
    "provider": "anthropic",
    "id": "claude-opus-4-5-20251101",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-opus-4-6": {
    "provider": "anthropic",
    "id": "claude-opus-4-6",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-opus-4-7": {
    "provider": "anthropic",
    "id": "claude-opus-4-7",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-opus-4-8": {
    "provider": "anthropic",
    "id": "claude-opus-4-8",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-opus-5": {
    "provider": "anthropic",
    "id": "claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-opus-5-5": {
    "provider": "anthropic",
    "id": "claude-opus-5-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-sonnet-4-5": {
    "provider": "anthropic",
    "id": "claude-sonnet-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-sonnet-4-5-20250929": {
    "provider": "anthropic",
    "id": "claude-sonnet-4-5-20250929",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "anthropic/claude-sonnet-4-6": {
    "provider": "anthropic",
    "id": "claude-sonnet-4-6",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "anthropic/claude-sonnet-5": {
    "provider": "anthropic",
    "id": "claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.anthropic.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "baseten/deepseek-ai/DeepSeek-V4-Flash-0731": {
    "provider": "baseten",
    "id": "deepseek-ai/DeepSeek-V4-Flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "baseten/deepseek-ai/DeepSeek-V4-Pro": {
    "provider": "baseten",
    "id": "deepseek-ai/DeepSeek-V4-Pro",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/deepseek-ai/DeepSeek-V4-Pro-0813": {
    "provider": "baseten",
    "id": "deepseek-ai/DeepSeek-V4-Pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/deepseek-ai/DeepSeek-V4.1-Flash": {
    "provider": "baseten",
    "id": "deepseek-ai/DeepSeek-V4.1-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "baseten/moonshotai/Kimi-K2.5": {
    "provider": "baseten",
    "id": "moonshotai/Kimi-K2.5",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "baseten/moonshotai/Kimi-K2.6": {
    "provider": "baseten",
    "id": "moonshotai/Kimi-K2.6",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "baseten/moonshotai/Kimi-K2.7-Code": {
    "provider": "baseten",
    "id": "moonshotai/Kimi-K2.7-Code",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "baseten/moonshotai/Kimi-K3": {
    "provider": "baseten",
    "id": "moonshotai/Kimi-K3",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B": {
    "provider": "baseten",
    "id": "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 202800,
    "maxOutputTokens": 202800
  },
  "baseten/nvidia/Nemotron-120B-A12B": {
    "provider": "baseten",
    "id": "nvidia/Nemotron-120B-A12B",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 202800,
    "maxOutputTokens": 202800
  },
  "baseten/openai/gpt-oss-120b": {
    "provider": "baseten",
    "id": "openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 128072,
    "maxOutputTokens": 128072
  },
  "baseten/thinkingmachines/inkling": {
    "provider": "baseten",
    "id": "thinkingmachines/inkling",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "baseten/thinkingmachines/inkling-small": {
    "provider": "baseten",
    "id": "thinkingmachines/inkling-small",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "baseten/zai-org/GLM-4.7": {
    "provider": "baseten",
    "id": "zai-org/GLM-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 200000
  },
  "baseten/zai-org/GLM-5": {
    "provider": "baseten",
    "id": "zai-org/GLM-5",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 202800,
    "maxOutputTokens": 202800
  },
  "baseten/zai-org/GLM-5.1": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 202800,
    "maxOutputTokens": 202800
  },
  "baseten/zai-org/GLM-5.2": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/zai-org/GLM-5.2-Fast": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.2-Fast",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/zai-org/GLM-5.3": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/zai-org/GLM-5.3-Fast": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.3-Fast",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "baseten/zai-org/GLM-5.3-Flash": {
    "provider": "baseten",
    "id": "zai-org/GLM-5.3-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://inference.baseten.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "cerebras/gpt-oss-120b": {
    "provider": "cerebras",
    "id": "gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cerebras.ai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 40960
  },
  "cerebras/qwen-3.8-27b": {
    "provider": "cerebras",
    "id": "qwen-3.8-27b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cerebras.ai/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 32768
  },
  "cloudflare-ai-gateway/claude-fable-5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-fable-5.1": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-fable-5.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-haiku-4.5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-haiku-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "cloudflare-ai-gateway/claude-opus-4.5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-opus-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "cloudflare-ai-gateway/claude-opus-4.6": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-opus-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-opus-4.7": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-opus-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-opus-4.8": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-opus-4.8",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-opus-5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-sonnet-4.5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-sonnet-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "cloudflare-ai-gateway/claude-sonnet-4.6": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-sonnet-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/claude-sonnet-5": {
    "provider": "cloudflare-ai-gateway",
    "id": "claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/deepseek-ai/deepseek-v4-flash-0731": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/deepseek-ai/deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "cloudflare-ai-gateway/workers-ai/@cf/deepseek-ai/deepseek-v4-pro-0813": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/deepseek-ai/deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "cloudflare-ai-gateway/workers-ai/@cf/google/gemma-4-26b-a4b-it": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/google/gemma-4-26b-a4b-it",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 256000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/workers-ai/@cf/ibm-granite/granite-4.0-h-micro": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/ibm-granite/granite-4.0-h-micro",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 131000,
    "maxOutputTokens": 131000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 24000,
    "maxOutputTokens": 24000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 131000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/workers-ai/@cf/mistralai/mistral-small-3.1-24b-instruct": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/mistralai/mistral-small-3.1-24b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/moonshotai/kimi-k2.6": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/moonshotai/kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/moonshotai/kimi-k2.7-code": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/moonshotai/kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "cloudflare-ai-gateway/workers-ai/@cf/nvidia/nemotron-3-120b-a12b": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/nvidia/nemotron-3-120b-a12b",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/openai/gpt-oss-120b": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/workers-ai/@cf/openai/gpt-oss-20b": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/workers-ai/@cf/qwen/qwen3-30b-a3b-fp8": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/qwen/qwen3-30b-a3b-fp8",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 32768,
    "maxOutputTokens": 32768
  },
  "cloudflare-ai-gateway/workers-ai/@cf/qwen/qwen3.8-27b": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/qwen/qwen3.8-27b",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "cloudflare-ai-gateway/workers-ai/@cf/zai-org/glm-4.7-flash": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/zai-org/glm-4.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "cloudflare-ai-gateway/workers-ai/@cf/zai-org/glm-5.2": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/zai-org/glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "cloudflare-ai-gateway/workers-ai/@cf/zai-org/glm-5.3": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/zai-org/glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "cloudflare-ai-gateway/workers-ai/@cf/zai-org/glm-5.3-flash": {
    "provider": "cloudflare-ai-gateway",
    "id": "workers-ai/@cf/zai-org/glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "cloudflare-ai-gateway/gpt-4.1": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-4.1",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "cloudflare-ai-gateway/gpt-4.1-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-4.1-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "cloudflare-ai-gateway/gpt-4.1-nano": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-4.1-nano",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1000000,
    "maxOutputTokens": 32768
  },
  "cloudflare-ai-gateway/gpt-4o": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-4o",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/gpt-4o-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-4o-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-ai-gateway/gpt-5": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5-nano": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5-nano",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.1": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.4": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.4",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.4-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.4-nano": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.4-nano",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.4-pro": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.5": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.5",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.5-pro": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.6-luna": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.6-sol": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-5.6-terra": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-5.6-terra",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/gpt-6-astra": {
    "provider": "cloudflare-ai-gateway",
    "id": "gpt-6-astra",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "cloudflare-ai-gateway/o3": {
    "provider": "cloudflare-ai-gateway",
    "id": "o3",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "cloudflare-ai-gateway/o3-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "o3-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "cloudflare-ai-gateway/o4-mini": {
    "provider": "cloudflare-ai-gateway",
    "id": "o4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "cloudflare-workers-ai/@cf/deepseek-ai/deepseek-v4-flash-0731": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/deepseek-ai/deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "cloudflare-workers-ai/@cf/deepseek-ai/deepseek-v4-pro-0813": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/deepseek-ai/deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "cloudflare-workers-ai/@cf/google/gemma-4-26b-a4b-it": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/google/gemma-4-26b-a4b-it",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 16384
  },
  "cloudflare-workers-ai/@cf/ibm-granite/granite-4.0-h-micro": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/ibm-granite/granite-4.0-h-micro",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 131000,
    "maxOutputTokens": 131000
  },
  "cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 24000,
    "maxOutputTokens": 24000
  },
  "cloudflare-workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/meta/llama-4-scout-17b-16e-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 131000,
    "maxOutputTokens": 16384
  },
  "cloudflare-workers-ai/@cf/mistralai/mistral-small-3.1-24b-instruct": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/mistralai/mistral-small-3.1-24b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "cloudflare-workers-ai/@cf/moonshotai/kimi-k2.6": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/moonshotai/kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "cloudflare-workers-ai/@cf/moonshotai/kimi-k2.7-code": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/moonshotai/kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "cloudflare-workers-ai/@cf/nvidia/nemotron-3-120b-a12b": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/nvidia/nemotron-3-120b-a12b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "cloudflare-workers-ai/@cf/openai/gpt-oss-120b": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-workers-ai/@cf/openai/gpt-oss-20b": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "cloudflare-workers-ai/@cf/qwen/qwen3-30b-a3b-fp8": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/qwen/qwen3-30b-a3b-fp8",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 32768
  },
  "cloudflare-workers-ai/@cf/qwen/qwen3.8-27b": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/qwen/qwen3.8-27b",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "cloudflare-workers-ai/@cf/zai-org/glm-4.7-flash": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/zai-org/glm-4.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "cloudflare-workers-ai/@cf/zai-org/glm-5.2": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/zai-org/glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "cloudflare-workers-ai/@cf/zai-org/glm-5.3": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/zai-org/glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "cloudflare-workers-ai/@cf/zai-org/glm-5.3-flash": {
    "provider": "cloudflare-workers-ai",
    "id": "@cf/zai-org/glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    "contextWindow": 1310720,
    "maxOutputTokens": 1048576
  },
  "deepseek/deepseek-flash": {
    "provider": "deepseek",
    "id": "deepseek-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.deepseek.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "deepseek/deepseek-v4-pro": {
    "provider": "deepseek",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.deepseek.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/deepseek-v4-flash-0731": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/deepseek-v4-flash-0731",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/deepseek-v4-flash-vision-exp": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/deepseek-v4-flash-vision-exp",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/deepseek-v4-pro": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/deepseek-v4-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/deepseek-v4-pro-0813": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/deepseek-v4-pro-0813",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/deepseek-v4p1-flash": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/deepseek-v4p1-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/models/gpt-oss-120b": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/gpt-oss-120b",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "fireworks/accounts/fireworks/models/inkling": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/inkling",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "fireworks/accounts/fireworks/models/kimi-k2p6": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/kimi-k2p6",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "fireworks/accounts/fireworks/models/kimi-k2p7-code": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/kimi-k2p7-code",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "fireworks/accounts/fireworks/models/minimax-m2p7": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/minimax-m2p7",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 196608,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/minimax-m3": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/minimax-m3",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 512000,
    "maxOutputTokens": 512000
  },
  "fireworks/accounts/fireworks/models/muse-glimmer-30b": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/muse-glimmer-30b",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/nemotron-3-ultra-nvfp4": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/nemotron-3-ultra-nvfp4",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 128000
  },
  "fireworks/accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "fireworks/accounts/fireworks/models/qwen3p7-plus": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/qwen3p7-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "fireworks/accounts/fireworks/models/qwen3p8-2p4t-a95b": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/qwen3p8-2p4t-a95b",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/qwen3p8-max": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/qwen3p8-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/deepseek-flash-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/deepseek-flash-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/routers/deepseek-pro-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/deepseek-pro-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "fireworks/accounts/fireworks/routers/kimi-fast-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/kimi-fast-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/kimi-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/kimi-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/minimax-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/minimax-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 512000,
    "maxOutputTokens": 512000
  },
  "fireworks/accounts/fireworks/routers/qwen-max-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/qwen-max-latest",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.fireworks.ai/inference",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/glm-5p2": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/glm-5p2",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048575,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/glm-5p3": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/glm-5p3",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048573,
    "maxOutputTokens": 262144
  },
  "fireworks/accounts/fireworks/models/glm-5p3-flash": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/glm-5p3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048573,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/models/kimi-k3": {
    "provider": "fireworks",
    "id": "accounts/fireworks/models/kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/glm-5p2-fast": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/glm-5p2-fast",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048575,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/glm-5p3-fast": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/glm-5p3-fast",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048572,
    "maxOutputTokens": 262144
  },
  "fireworks/accounts/fireworks/routers/glm-fast-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/glm-fast-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048572,
    "maxOutputTokens": 262144
  },
  "fireworks/accounts/fireworks/routers/glm-flash-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/glm-flash-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048573,
    "maxOutputTokens": 131072
  },
  "fireworks/accounts/fireworks/routers/glm-latest": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/glm-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048573,
    "maxOutputTokens": 262144
  },
  "fireworks/accounts/fireworks/routers/kimi-k3-fast": {
    "provider": "fireworks",
    "id": "accounts/fireworks/routers/kimi-k3-fast",
    "protocol": "openai-completions",
    "endpoint": "https://api.fireworks.ai/inference/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "github-copilot/claude-fable-5": {
    "provider": "github-copilot",
    "id": "claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/claude-fable-5.1": {
    "provider": "github-copilot",
    "id": "claude-fable-5.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/claude-haiku-4.5": {
    "provider": "github-copilot",
    "id": "claude-haiku-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "github-copilot/claude-opus-4.7": {
    "provider": "github-copilot",
    "id": "claude-opus-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 32000
  },
  "github-copilot/claude-opus-4.8": {
    "provider": "github-copilot",
    "id": "claude-opus-4.8",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "github-copilot/claude-opus-5": {
    "provider": "github-copilot",
    "id": "claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "github-copilot/claude-opus-5.5": {
    "provider": "github-copilot",
    "id": "claude-opus-5.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/claude-sonnet-4.6": {
    "provider": "github-copilot",
    "id": "claude-sonnet-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 32000
  },
  "github-copilot/claude-sonnet-5": {
    "provider": "github-copilot",
    "id": "claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gemini-3.5-flash": {
    "provider": "github-copilot",
    "id": "gemini-3.5-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "github-copilot/gemini-3.6-flash": {
    "provider": "github-copilot",
    "id": "gemini-3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "github-copilot/gemini-3.7-flash": {
    "provider": "github-copilot",
    "id": "gemini-3.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "github-copilot/gemini-3.8-flash": {
    "provider": "github-copilot",
    "id": "gemini-3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "github-copilot/kimi-k2.7-code": {
    "provider": "github-copilot",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "github-copilot/kimi-k3": {
    "provider": "github-copilot",
    "id": "kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "github-copilot/gpt-5-mini": {
    "provider": "github-copilot",
    "id": "gpt-5-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 264000,
    "maxOutputTokens": 64000
  },
  "github-copilot/gpt-5.3-codex": {
    "provider": "github-copilot",
    "id": "gpt-5.3-codex",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.4": {
    "provider": "github-copilot",
    "id": "gpt-5.4",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.4-mini": {
    "provider": "github-copilot",
    "id": "gpt-5.4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.4-nano": {
    "provider": "github-copilot",
    "id": "gpt-5.4-nano",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.5": {
    "provider": "github-copilot",
    "id": "gpt-5.5",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.6-luna": {
    "provider": "github-copilot",
    "id": "gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.6-sol": {
    "provider": "github-copilot",
    "id": "gpt-5.6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-5.6-terra": {
    "provider": "github-copilot",
    "id": "gpt-5.6-terra",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-6-astra": {
    "provider": "github-copilot",
    "id": "gpt-6-astra",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-6-luna": {
    "provider": "github-copilot",
    "id": "gpt-6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/gpt-6-sol": {
    "provider": "github-copilot",
    "id": "gpt-6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "github-copilot/grok-4.5": {
    "provider": "github-copilot",
    "id": "grok-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 500000,
    "maxOutputTokens": 128000
  },
  "github-copilot/grok-4.6": {
    "provider": "github-copilot",
    "id": "grok-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 500000,
    "maxOutputTokens": 128000
  },
  "github-copilot/grok-4.7": {
    "provider": "github-copilot",
    "id": "grok-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 500000,
    "maxOutputTokens": 128000
  },
  "github-copilot/mai-code-1-flash-picker": {
    "provider": "github-copilot",
    "id": "mai-code-1-flash-picker",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 256000,
    "maxOutputTokens": 128000
  },
  "github-copilot/mai-code-1.1-flash": {
    "provider": "github-copilot",
    "id": "mai-code-1.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.individual.githubcopilot.com",
    "contextWindow": 256000,
    "maxOutputTokens": 128000
  },
  "groq/llama-3.1-8b-instant": {
    "provider": "groq",
    "id": "llama-3.1-8b-instant",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "groq/llama-3.3-70b-versatile": {
    "provider": "groq",
    "id": "llama-3.3-70b-versatile",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "groq/openai/gpt-oss-120b": {
    "provider": "groq",
    "id": "openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "groq/openai/gpt-oss-20b": {
    "provider": "groq",
    "id": "openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "groq/openai/gpt-oss-safeguard-20b": {
    "provider": "groq",
    "id": "openai/gpt-oss-safeguard-20b",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "groq/qwen/qwen3.6-27b": {
    "provider": "groq",
    "id": "qwen/qwen3.6-27b",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "groq/qwen/qwen3.8-27b": {
    "provider": "groq",
    "id": "qwen/qwen3.8-27b",
    "protocol": "openai-completions",
    "endpoint": "https://api.groq.com/openai/v1",
    "contextWindow": 131042,
    "maxOutputTokens": 16384
  },
  "huggingface/MiniMaxAI/MiniMax-M2": {
    "provider": "huggingface",
    "id": "MiniMaxAI/MiniMax-M2",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/MiniMaxAI/MiniMax-M2.1": {
    "provider": "huggingface",
    "id": "MiniMaxAI/MiniMax-M2.1",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/MiniMaxAI/MiniMax-M2.5": {
    "provider": "huggingface",
    "id": "MiniMaxAI/MiniMax-M2.5",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/MiniMaxAI/MiniMax-M2.7": {
    "provider": "huggingface",
    "id": "MiniMaxAI/MiniMax-M2.7",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/MiniMaxAI/MiniMax-M3": {
    "provider": "huggingface",
    "id": "MiniMaxAI/MiniMax-M3",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 512000
  },
  "huggingface/Qwen/Qwen2.5-Coder-32B-Instruct": {
    "provider": "huggingface",
    "id": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 8192
  },
  "huggingface/Qwen/Qwen3-235B-A22B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-235B-A22B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "huggingface/Qwen/Qwen3-235B-A22B-Instruct-2507": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-235B-A22B-Instruct-2507",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "huggingface/Qwen/Qwen3-235B-A22B-Thinking-2507": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-235B-A22B-Thinking-2507",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "huggingface/Qwen/Qwen3-30B-A3B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-30B-A3B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "huggingface/Qwen/Qwen3-32B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-32B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "huggingface/Qwen/Qwen3-Coder-30B-A3B-Instruct": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-Coder-30B-A3B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3-Coder-480B-A35B-Instruct": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 66536
  },
  "huggingface/Qwen/Qwen3-Coder-Next": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-Coder-Next",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3-Next-80B-A3B-Instruct": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-Next-80B-A3B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 66536
  },
  "huggingface/Qwen/Qwen3-Next-80B-A3B-Thinking": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-Next-80B-A3B-Thinking",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "huggingface/Qwen/Qwen3-VL-235B-A22B-Instruct": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-VL-235B-A22B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "huggingface/Qwen/Qwen3-VL-235B-A22B-Thinking": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3-VL-235B-A22B-Thinking",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "huggingface/Qwen/Qwen3.5-122B-A10B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.5-122B-A10B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.5-27B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.5-27B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.5-35B-A3B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.5-35B-A3B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.5-397B-A17B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.5-397B-A17B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "huggingface/Qwen/Qwen3.5-9B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.5-9B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.6-27B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.6-27B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.6-35B-A3B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.6-35B-A3B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "huggingface/Qwen/Qwen3.8-2.4T-A95B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.8-2.4T-A95B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "huggingface/Qwen/Qwen3.8-27B": {
    "provider": "huggingface",
    "id": "Qwen/Qwen3.8-27B",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "huggingface/XiaomiMiMo/MiMo-V2-Flash": {
    "provider": "huggingface",
    "id": "XiaomiMiMo/MiMo-V2-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 4096
  },
  "huggingface/XiaomiMiMo/MiMo-V2.5": {
    "provider": "huggingface",
    "id": "XiaomiMiMo/MiMo-V2.5",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "huggingface/XiaomiMiMo/MiMo-V2.5-Pro": {
    "provider": "huggingface",
    "id": "XiaomiMiMo/MiMo-V2.5-Pro",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "huggingface/deepseek-ai/DeepSeek-R1": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-R1",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 64000,
    "maxOutputTokens": 32768
  },
  "huggingface/deepseek-ai/DeepSeek-R1-0528": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-R1-0528",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 163840
  },
  "huggingface/deepseek-ai/DeepSeek-V3": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V3",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 64000,
    "maxOutputTokens": 8192
  },
  "huggingface/deepseek-ai/DeepSeek-V3-0324": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V3-0324",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 163840
  },
  "huggingface/deepseek-ai/DeepSeek-V3.1": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V3.1",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 8192
  },
  "huggingface/deepseek-ai/DeepSeek-V3.2": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V3.2",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 65536
  },
  "huggingface/deepseek-ai/DeepSeek-V4-Flash": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "huggingface/deepseek-ai/DeepSeek-V4-Flash-0731": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4-Flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "huggingface/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "huggingface/deepseek-ai/DeepSeek-V4-Pro": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4-Pro",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 393216
  },
  "huggingface/deepseek-ai/DeepSeek-V4-Pro-0813": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4-Pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "huggingface/deepseek-ai/DeepSeek-V4.1-Flash": {
    "provider": "huggingface",
    "id": "deepseek-ai/DeepSeek-V4.1-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "huggingface/google/gemma-3-12b-it": {
    "provider": "huggingface",
    "id": "google/gemma-3-12b-it",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "huggingface/google/gemma-3-27b-it": {
    "provider": "huggingface",
    "id": "google/gemma-3-27b-it",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "huggingface/google/gemma-3-4b-it": {
    "provider": "huggingface",
    "id": "google/gemma-3-4b-it",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "huggingface/google/gemma-4-26B-A4B-it": {
    "provider": "huggingface",
    "id": "google/gemma-4-26B-A4B-it",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "huggingface/google/gemma-4-31B-it": {
    "provider": "huggingface",
    "id": "google/gemma-4-31B-it",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "huggingface/meta-llama/Llama-3.1-8B-Instruct": {
    "provider": "huggingface",
    "id": "meta-llama/Llama-3.1-8B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 4096
  },
  "huggingface/meta-llama/Llama-3.3-70B-Instruct": {
    "provider": "huggingface",
    "id": "meta-llama/Llama-3.3-70B-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 4096
  },
  "huggingface/moonshotai/Kimi-K2-Instruct": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2-Instruct",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "huggingface/moonshotai/Kimi-K2-Instruct-0905": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2-Instruct-0905",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "huggingface/moonshotai/Kimi-K2-Thinking": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2-Thinking",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "huggingface/moonshotai/Kimi-K2.5": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2.5",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "huggingface/moonshotai/Kimi-K2.6": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2.6",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "huggingface/moonshotai/Kimi-K2.7-Code": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K2.7-Code",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "huggingface/moonshotai/Kimi-K3": {
    "provider": "huggingface",
    "id": "moonshotai/Kimi-K3",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "huggingface/openai/gpt-oss-120b": {
    "provider": "huggingface",
    "id": "openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "huggingface/openai/gpt-oss-20b": {
    "provider": "huggingface",
    "id": "openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "huggingface/stepfun-ai/Step-3.5-Flash": {
    "provider": "huggingface",
    "id": "stepfun-ai/Step-3.5-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "huggingface/stepfun-ai/Step-3.7-Flash": {
    "provider": "huggingface",
    "id": "stepfun-ai/Step-3.7-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "huggingface/tencent/Hy3": {
    "provider": "huggingface",
    "id": "tencent/Hy3",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 128000
  },
  "huggingface/tencent/Hy4-preview": {
    "provider": "huggingface",
    "id": "tencent/Hy4-preview",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "huggingface/thinkingmachines/Inkling": {
    "provider": "huggingface",
    "id": "thinkingmachines/Inkling",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "huggingface/thinkingmachines/Inkling-Small": {
    "provider": "huggingface",
    "id": "thinkingmachines/Inkling-Small",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 1048576
  },
  "huggingface/zai-org/GLM-4.5": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 98304
  },
  "huggingface/zai-org/GLM-4.5-Air": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.5-Air",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 98304
  },
  "huggingface/zai-org/GLM-4.5V": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.5V",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 16384
  },
  "huggingface/zai-org/GLM-4.6": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-4.6V-Flash": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.6V-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "huggingface/zai-org/GLM-4.7": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-4.7-Flash": {
    "provider": "huggingface",
    "id": "zai-org/GLM-4.7-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 128000
  },
  "huggingface/zai-org/GLM-5": {
    "provider": "huggingface",
    "id": "zai-org/GLM-5",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-5.1": {
    "provider": "huggingface",
    "id": "zai-org/GLM-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-5.2": {
    "provider": "huggingface",
    "id": "zai-org/GLM-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-5.3": {
    "provider": "huggingface",
    "id": "zai-org/GLM-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "huggingface/zai-org/GLM-5.3-Flash": {
    "provider": "huggingface",
    "id": "zai-org/GLM-5.3-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://router.huggingface.co/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "kimi-coding/k3": {
    "provider": "kimi-coding",
    "id": "k3",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.kimi.com/coding",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "kimi-coding/k3-256k": {
    "provider": "kimi-coding",
    "id": "k3-256k",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.kimi.com/coding",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "kimi-coding/kimi-for-coding": {
    "provider": "kimi-coding",
    "id": "kimi-for-coding",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.kimi.com/coding",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "kimi-coding/kimi-for-coding-highspeed": {
    "provider": "kimi-coding",
    "id": "kimi-for-coding-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.kimi.com/coding",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "meta/muse-spark-1.1": {
    "provider": "meta",
    "id": "muse-spark-1.1",
    "protocol": "openai-completions",
    "endpoint": "https://api.meta.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "meta/muse-spark-1.2": {
    "provider": "meta",
    "id": "muse-spark-1.2",
    "protocol": "openai-completions",
    "endpoint": "https://api.meta.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "meta/muse-spark-1.2-contributor": {
    "provider": "meta",
    "id": "muse-spark-1.2-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://api.meta.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "meta/muse-spark-1.3": {
    "provider": "meta",
    "id": "muse-spark-1.3",
    "protocol": "openai-completions",
    "endpoint": "https://api.meta.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "meta/muse-spark-1.3-contributor": {
    "provider": "meta",
    "id": "muse-spark-1.3-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://api.meta.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "minimax/MiniMax-M2.7": {
    "provider": "minimax",
    "id": "MiniMax-M2.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimax.io/anthropic",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "minimax/MiniMax-M2.7-highspeed": {
    "provider": "minimax",
    "id": "MiniMax-M2.7-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimax.io/anthropic",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "minimax/MiniMax-M3": {
    "provider": "minimax",
    "id": "MiniMax-M3",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimax.io/anthropic",
    "contextWindow": 1048576,
    "maxOutputTokens": 512000
  },
  "minimax-cn/MiniMax-M2.7": {
    "provider": "minimax-cn",
    "id": "MiniMax-M2.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimaxi.com/anthropic",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "minimax-cn/MiniMax-M2.7-highspeed": {
    "provider": "minimax-cn",
    "id": "MiniMax-M2.7-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimaxi.com/anthropic",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "minimax-cn/MiniMax-M3": {
    "provider": "minimax-cn",
    "id": "MiniMax-M3",
    "protocol": "anthropic-messages",
    "endpoint": "https://api.minimaxi.com/anthropic",
    "contextWindow": 1048576,
    "maxOutputTokens": 512000
  },
  "moonshotai/kimi-k2.6": {
    "provider": "moonshotai",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai/kimi-k2.7-code": {
    "provider": "moonshotai",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai/kimi-k2.7-code-highspeed": {
    "provider": "moonshotai",
    "id": "kimi-k2.7-code-highspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai/kimi-k3": {
    "provider": "moonshotai",
    "id": "kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "moonshotai-cn/kimi-k2.6": {
    "provider": "moonshotai-cn",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.cn/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai-cn/kimi-k2.7-code": {
    "provider": "moonshotai-cn",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.cn/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai-cn/kimi-k2.7-code-highspeed": {
    "provider": "moonshotai-cn",
    "id": "kimi-k2.7-code-highspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.cn/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "moonshotai-cn/kimi-k3": {
    "provider": "moonshotai-cn",
    "id": "kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://api.moonshot.cn/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "nvidia/google/gemma-3-12b-it": {
    "provider": "nvidia",
    "id": "google/gemma-3-12b-it",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "nvidia/google/gemma-3-4b-it": {
    "provider": "nvidia",
    "id": "google/gemma-3-4b-it",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "nvidia/meta/llama-3.2-11b-vision-instruct": {
    "provider": "nvidia",
    "id": "meta/llama-3.2-11b-vision-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "nvidia/meta/llama-3.2-90b-vision-instruct": {
    "provider": "nvidia",
    "id": "meta/llama-3.2-90b-vision-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "nvidia/meta/muse-glimmer-30b": {
    "provider": "nvidia",
    "id": "meta/muse-glimmer-30b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "nvidia/mistralai/mistral-7b-instruct-v0.3": {
    "provider": "nvidia",
    "id": "mistralai/mistral-7b-instruct-v0.3",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 65536
  },
  "nvidia/moonshotai/kimi-k2.6": {
    "provider": "nvidia",
    "id": "moonshotai/kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "nvidia/moonshotai/kimi-k3": {
    "provider": "nvidia",
    "id": "moonshotai/kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "nvidia/nvidia/cosmos-reason2-8b": {
    "provider": "nvidia",
    "id": "nvidia/cosmos-reason2-8b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "nvidia/nvidia/llama-3.1-nemotron-70b-instruct": {
    "provider": "nvidia",
    "id": "nvidia/llama-3.1-nemotron-70b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "nvidia/nvidia/llama-3.1-nemotron-ultra-253b-v1": {
    "provider": "nvidia",
    "id": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": {
    "provider": "nvidia",
    "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 65536
  },
  "nvidia/nvidia/nemotron-3-super-120b-a12b": {
    "provider": "nvidia",
    "id": "nvidia/nemotron-3-super-120b-a12b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
    "provider": "nvidia",
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "nvidia/nvidia/nemotron-3.5-lightning-30b-a3b": {
    "provider": "nvidia",
    "id": "nvidia/nemotron-3.5-lightning-30b-a3b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "nvidia/openai/gpt-oss-20b": {
    "provider": "nvidia",
    "id": "openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "nvidia/poolside/laguna-xs-2.1": {
    "provider": "nvidia",
    "id": "poolside/laguna-xs-2.1",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "nvidia/z-ai/glm-5.3": {
    "provider": "nvidia",
    "id": "z-ai/glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "nvidia/z-ai/glm-5.3-flash": {
    "provider": "nvidia",
    "id": "z-ai/glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://integrate.api.nvidia.com/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openai/gpt-4": {
    "provider": "openai",
    "id": "gpt-4",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 8192,
    "maxOutputTokens": 8192
  },
  "openai/gpt-4-turbo": {
    "provider": "openai",
    "id": "gpt-4-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "openai/gpt-4.1": {
    "provider": "openai",
    "id": "gpt-4.1",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openai/gpt-4.1-mini": {
    "provider": "openai",
    "id": "gpt-4.1-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openai/gpt-4.1-nano": {
    "provider": "openai",
    "id": "gpt-4.1-nano",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openai/gpt-4o": {
    "provider": "openai",
    "id": "gpt-4o",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-4o-2024-05-13": {
    "provider": "openai",
    "id": "gpt-4o-2024-05-13",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "openai/gpt-4o-2024-08-06": {
    "provider": "openai",
    "id": "gpt-4o-2024-08-06",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-4o-2024-11-20": {
    "provider": "openai",
    "id": "gpt-4o-2024-11-20",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-4o-mini": {
    "provider": "openai",
    "id": "gpt-4o-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-5": {
    "provider": "openai",
    "id": "gpt-5",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5-chat-latest": {
    "provider": "openai",
    "id": "gpt-5-chat-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-5-mini": {
    "provider": "openai",
    "id": "gpt-5-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5-nano": {
    "provider": "openai",
    "id": "gpt-5-nano",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5-pro": {
    "provider": "openai",
    "id": "gpt-5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.1": {
    "provider": "openai",
    "id": "gpt-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.2": {
    "provider": "openai",
    "id": "gpt-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.2-chat-latest": {
    "provider": "openai",
    "id": "gpt-5.2-chat-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-5.2-pro": {
    "provider": "openai",
    "id": "gpt-5.2-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.3-chat-latest": {
    "provider": "openai",
    "id": "gpt-5.3-chat-latest",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openai/gpt-5.3-codex": {
    "provider": "openai",
    "id": "gpt-5.3-codex",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.3-codex-spark": {
    "provider": "openai",
    "id": "gpt-5.3-codex-spark",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 32000
  },
  "openai/gpt-5.4": {
    "provider": "openai",
    "id": "gpt-5.4",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.4-mini": {
    "provider": "openai",
    "id": "gpt-5.4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.4-nano": {
    "provider": "openai",
    "id": "gpt-5.4-nano",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.4-pro": {
    "provider": "openai",
    "id": "gpt-5.4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.5": {
    "provider": "openai",
    "id": "gpt-5.5",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.5-pro": {
    "provider": "openai",
    "id": "gpt-5.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.6-luna": {
    "provider": "openai",
    "id": "gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.6-sol": {
    "provider": "openai",
    "id": "gpt-5.6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-5.6-terra": {
    "provider": "openai",
    "id": "gpt-5.6-terra",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-6-astra": {
    "provider": "openai",
    "id": "gpt-6-astra",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-6-luna": {
    "provider": "openai",
    "id": "gpt-6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-6-sol": {
    "provider": "openai",
    "id": "gpt-6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "openai/gpt-realtime-2.1": {
    "provider": "openai",
    "id": "gpt-realtime-2.1",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 32000
  },
  "openai/o1": {
    "provider": "openai",
    "id": "o1",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openai/o1-pro": {
    "provider": "openai",
    "id": "o1-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openai/o3": {
    "provider": "openai",
    "id": "o3",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openai/o3-mini": {
    "provider": "openai",
    "id": "o3-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openai/o3-pro": {
    "provider": "openai",
    "id": "o3-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openai/o4-mini": {
    "provider": "openai",
    "id": "o4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://api.openai.com/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "opencode/claude-fable-5": {
    "provider": "opencode",
    "id": "claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-fable-5-1": {
    "provider": "opencode",
    "id": "claude-fable-5-1",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-haiku-4-5": {
    "provider": "opencode",
    "id": "claude-haiku-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "opencode/claude-opus-4-5": {
    "provider": "opencode",
    "id": "claude-opus-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "opencode/claude-opus-4-6": {
    "provider": "opencode",
    "id": "claude-opus-4-6",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-opus-4-7": {
    "provider": "opencode",
    "id": "claude-opus-4-7",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-opus-4-8": {
    "provider": "opencode",
    "id": "claude-opus-4-8",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-opus-5": {
    "provider": "opencode",
    "id": "claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-opus-5-5": {
    "provider": "opencode",
    "id": "claude-opus-5-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/claude-sonnet-4": {
    "provider": "opencode",
    "id": "claude-sonnet-4",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "opencode/claude-sonnet-4-5": {
    "provider": "opencode",
    "id": "claude-sonnet-4-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "opencode/claude-sonnet-4-6": {
    "provider": "opencode",
    "id": "claude-sonnet-4-6",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "opencode/claude-sonnet-5": {
    "provider": "opencode",
    "id": "claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/qwen3.5-plus": {
    "provider": "opencode",
    "id": "qwen3.5-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "opencode/qwen3.6-plus": {
    "provider": "opencode",
    "id": "qwen3.6-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "opencode/qwen3.8-flash": {
    "provider": "opencode",
    "id": "qwen3.8-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode/big-pickle": {
    "provider": "opencode",
    "id": "big-pickle",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 32000
  },
  "opencode/deepseek-v4-flash": {
    "provider": "opencode",
    "id": "deepseek-v4-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode/deepseek-v4-flash-vision-exp": {
    "provider": "opencode",
    "id": "deepseek-v4-flash-vision-exp",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode/deepseek-v4-pro": {
    "provider": "opencode",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode/deepseek-v4.1-flash": {
    "provider": "opencode",
    "id": "deepseek-v4.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode/glm-5": {
    "provider": "opencode",
    "id": "glm-5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "opencode/glm-5.1": {
    "provider": "opencode",
    "id": "glm-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "opencode/glm-5.2": {
    "provider": "opencode",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode/glm-5.3": {
    "provider": "opencode",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode/glm-5.3-flash": {
    "provider": "opencode",
    "id": "glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode/kimi-k2.5": {
    "provider": "opencode",
    "id": "kimi-k2.5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "opencode/kimi-k2.6": {
    "provider": "opencode",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "opencode/kimi-k2.7-code": {
    "provider": "opencode",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "opencode/kimi-k3": {
    "provider": "opencode",
    "id": "kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode/ling-3.0-flash-fin-free": {
    "provider": "opencode",
    "id": "ling-3.0-flash-fin-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "opencode/mimo-v2.6-flash-free": {
    "provider": "opencode",
    "id": "mimo-v2.6-flash-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 32000
  },
  "opencode/minimax-m2.5": {
    "provider": "opencode",
    "id": "minimax-m2.5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "opencode/minimax-m2.7": {
    "provider": "opencode",
    "id": "minimax-m2.7",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "opencode/minimax-m3": {
    "provider": "opencode",
    "id": "minimax-m3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 512000,
    "maxOutputTokens": 128000
  },
  "opencode/nemotron-3-ultra-free": {
    "provider": "opencode",
    "id": "nemotron-3-ultra-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode/nemotron-3.5-lightning-free": {
    "provider": "opencode",
    "id": "nemotron-3.5-lightning-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "opencode/gpt-5": {
    "provider": "opencode",
    "id": "gpt-5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5-codex": {
    "provider": "opencode",
    "id": "gpt-5-codex",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5-nano": {
    "provider": "opencode",
    "id": "gpt-5-nano",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.1": {
    "provider": "opencode",
    "id": "gpt-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.1-codex": {
    "provider": "opencode",
    "id": "gpt-5.1-codex",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.1-codex-max": {
    "provider": "opencode",
    "id": "gpt-5.1-codex-max",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.1-codex-mini": {
    "provider": "opencode",
    "id": "gpt-5.1-codex-mini",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.2": {
    "provider": "opencode",
    "id": "gpt-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.2-codex": {
    "provider": "opencode",
    "id": "gpt-5.2-codex",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.3-codex": {
    "provider": "opencode",
    "id": "gpt-5.3-codex",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.4": {
    "provider": "opencode",
    "id": "gpt-5.4",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 272000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.4-mini": {
    "provider": "opencode",
    "id": "gpt-5.4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.4-nano": {
    "provider": "opencode",
    "id": "gpt-5.4-nano",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.4-pro": {
    "provider": "opencode",
    "id": "gpt-5.4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.5": {
    "provider": "opencode",
    "id": "gpt-5.5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.5-pro": {
    "provider": "opencode",
    "id": "gpt-5.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.6-luna": {
    "provider": "opencode",
    "id": "gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.6-sol": {
    "provider": "opencode",
    "id": "gpt-5.6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-5.6-terra": {
    "provider": "opencode",
    "id": "gpt-5.6-terra",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-6-astra": {
    "provider": "opencode",
    "id": "gpt-6-astra",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-6-luna": {
    "provider": "opencode",
    "id": "gpt-6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/gpt-6-sol": {
    "provider": "opencode",
    "id": "gpt-6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode/grok-4.5": {
    "provider": "opencode",
    "id": "grok-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "opencode/grok-4.6": {
    "provider": "opencode",
    "id": "grok-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "opencode/grok-build-0.1": {
    "provider": "opencode",
    "id": "grok-build-0.1",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "opencode/muse-spark-1.2": {
    "provider": "opencode",
    "id": "muse-spark-1.2",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode/muse-spark-1.2-contributor-free": {
    "provider": "opencode",
    "id": "muse-spark-1.2-contributor-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode/muse-spark-1.3": {
    "provider": "opencode",
    "id": "muse-spark-1.3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode/muse-spark-1.3-contributor-free": {
    "provider": "opencode",
    "id": "muse-spark-1.3-contributor-free",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode-go/minimax-m3": {
    "provider": "opencode-go",
    "id": "minimax-m3",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen/go",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/qwen3.8-flash": {
    "provider": "opencode-go",
    "id": "qwen3.8-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://opencode.ai/zen/go",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/deepseek-v4-flash": {
    "provider": "opencode-go",
    "id": "deepseek-v4-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode-go/deepseek-v4-flash-vision-exp": {
    "provider": "opencode-go",
    "id": "deepseek-v4-flash-vision-exp",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode-go/deepseek-v4-pro": {
    "provider": "opencode-go",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode-go/deepseek-v4.1-flash": {
    "provider": "opencode-go",
    "id": "deepseek-v4.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "opencode-go/glm-5.1": {
    "provider": "opencode-go",
    "id": "glm-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 32768
  },
  "opencode-go/glm-5.2": {
    "provider": "opencode-go",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/glm-5.3": {
    "provider": "opencode-go",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/glm-5.3-flash": {
    "provider": "opencode-go",
    "id": "glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/hy3": {
    "provider": "opencode-go",
    "id": "hy3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 128000
  },
  "opencode-go/hy4-preview": {
    "provider": "opencode-go",
    "id": "hy4-preview",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1024000,
    "maxOutputTokens": 64000
  },
  "opencode-go/kimi-k2.6": {
    "provider": "opencode-go",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "opencode-go/kimi-k2.7-code": {
    "provider": "opencode-go",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "opencode-go/kimi-k3": {
    "provider": "opencode-go",
    "id": "kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode-go/longcat-2.0": {
    "provider": "opencode-go",
    "id": "longcat-2.0",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/mimo-v2.5": {
    "provider": "opencode-go",
    "id": "mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "opencode-go/mimo-v2.5-pro": {
    "provider": "opencode-go",
    "id": "mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 128000
  },
  "opencode-go/mimo-v2.6-flash": {
    "provider": "opencode-go",
    "id": "mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode-go/mimo-v2.6-pro": {
    "provider": "opencode-go",
    "id": "mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode-go/minimax-m2.7": {
    "provider": "opencode-go",
    "id": "minimax-m2.7",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "opencode-go/qwen3.6-plus": {
    "provider": "opencode-go",
    "id": "qwen3.6-plus",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "opencode-go/qwen3.7-max": {
    "provider": "opencode-go",
    "id": "qwen3.7-max",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "opencode-go/qwen3.7-plus": {
    "provider": "opencode-go",
    "id": "qwen3.7-plus",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "opencode-go/qwen3.8-max": {
    "provider": "opencode-go",
    "id": "qwen3.8-max",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "opencode-go/gpt-5.6-luna": {
    "provider": "opencode-go",
    "id": "gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "opencode-go/grok-4.6": {
    "provider": "opencode-go",
    "id": "grok-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "opencode-go/grok-4.7": {
    "provider": "opencode-go",
    "id": "grok-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "opencode-go/muse-spark-1.2-contributor": {
    "provider": "opencode-go",
    "id": "muse-spark-1.2-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "opencode-go/muse-spark-1.3-contributor": {
    "provider": "opencode-go",
    "id": "muse-spark-1.3-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://opencode.ai/zen/go/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/anthropic/claude-3-haiku": {
    "provider": "openrouter",
    "id": "anthropic/claude-3-haiku",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 200000,
    "maxOutputTokens": 4096
  },
  "openrouter/anthropic/claude-fable-5": {
    "provider": "openrouter",
    "id": "anthropic/claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-fable-5.1": {
    "provider": "openrouter",
    "id": "anthropic/claude-fable-5.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-haiku-4.5": {
    "provider": "openrouter",
    "id": "anthropic/claude-haiku-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-opus-4.1": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 200000,
    "maxOutputTokens": 32000
  },
  "openrouter/anthropic/claude-opus-4.5": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-opus-4.6": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-4.7": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-4.8": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.8",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-5": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-5.5": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-5.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-sonnet-4": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-4",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-sonnet-4.5": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-sonnet-4.6": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-sonnet-5": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://openrouter.ai/api",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/aion-labs/aion-2.0": {
    "provider": "openrouter",
    "id": "aion-labs/aion-2.0",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "openrouter/aion-labs/aion-3.0": {
    "provider": "openrouter",
    "id": "aion-labs/aion-3.0",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "openrouter/aion-labs/aion-3.0-mini": {
    "provider": "openrouter",
    "id": "aion-labs/aion-3.0-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "openrouter/amazon/nova-2-lite-v1": {
    "provider": "openrouter",
    "id": "amazon/nova-2-lite-v1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65535
  },
  "openrouter/amazon/nova-lite-v1": {
    "provider": "openrouter",
    "id": "amazon/nova-lite-v1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 300000,
    "maxOutputTokens": 5120
  },
  "openrouter/amazon/nova-micro-v1": {
    "provider": "openrouter",
    "id": "amazon/nova-micro-v1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 5120
  },
  "openrouter/amazon/nova-premier-v1": {
    "provider": "openrouter",
    "id": "amazon/nova-premier-v1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 32000
  },
  "openrouter/amazon/nova-pro-v1": {
    "provider": "openrouter",
    "id": "amazon/nova-pro-v1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 300000,
    "maxOutputTokens": 5120
  },
  "openrouter/anthropic/claude-fable-5.1:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-fable-5.1:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-fable-5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-fable-5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-haiku-4.5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-haiku-4.5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-opus-4.1:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.1:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 32000
  },
  "openrouter/anthropic/claude-opus-4.5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-opus-4.6:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.6:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-4.7:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.7:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-4.8:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-4.8:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-5.5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-5.5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-opus-5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-opus-5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-sonnet-4.5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-4.5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "openrouter/anthropic/claude-sonnet-4.6:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-4.6:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/anthropic/claude-sonnet-5:batch": {
    "provider": "openrouter",
    "id": "anthropic/claude-sonnet-5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/arcee-ai/trinity-large-thinking": {
    "provider": "openrouter",
    "id": "arcee-ai/trinity-large-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 80000
  },
  "openrouter/auto": {
    "provider": "openrouter",
    "id": "auto",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 2000000,
    "maxOutputTokens": 30000
  },
  "openrouter/bytedance-seed/seed-1.6": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-1.6",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/bytedance-seed/seed-1.6-flash": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-1.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/bytedance-seed/seed-2-1-turbo": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-2-1-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/bytedance-seed/seed-2.0-code": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-2.0-code",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "openrouter/bytedance-seed/seed-2.0-lite": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-2.0-lite",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "openrouter/bytedance-seed/seed-2.0-mini": {
    "provider": "openrouter",
    "id": "bytedance-seed/seed-2.0-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "openrouter/cohere/command-r-08-2024": {
    "provider": "openrouter",
    "id": "cohere/command-r-08-2024",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4000
  },
  "openrouter/cohere/command-r-plus-08-2024": {
    "provider": "openrouter",
    "id": "cohere/command-r-plus-08-2024",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4000
  },
  "openrouter/cohere/north-mini-code:free": {
    "provider": "openrouter",
    "id": "cohere/north-mini-code:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 64000
  },
  "openrouter/deepseek/deepseek-chat": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-chat",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 16384
  },
  "openrouter/deepseek/deepseek-chat-v3-0324": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-chat-v3-0324",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 147456
  },
  "openrouter/deepseek/deepseek-chat-v3.1": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-chat-v3.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 32768
  },
  "openrouter/deepseek/deepseek-r1": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-r1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 64000,
    "maxOutputTokens": 16000
  },
  "openrouter/deepseek/deepseek-r1-0528": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-r1-0528",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 32768
  },
  "openrouter/deepseek/deepseek-v3.1-terminus": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v3.1-terminus",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/deepseek/deepseek-v3.2": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v3.2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 65536
  },
  "openrouter/deepseek/deepseek-v3.2-exp": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v3.2-exp",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 163840,
    "maxOutputTokens": 65536
  },
  "openrouter/deepseek/deepseek-v4-flash": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1024000,
    "maxOutputTokens": 384000
  },
  "openrouter/deepseek/deepseek-v4-flash-0731": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/deepseek/deepseek-v4-flash-vision-exp": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4-flash-vision-exp",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/deepseek/deepseek-v4-pro": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1024000,
    "maxOutputTokens": 384000
  },
  "openrouter/deepseek/deepseek-v4-pro-0813": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "openrouter/deepseek/deepseek-v4.1-flash": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "openrouter/deepseek/deepseek-v4.1-flash:batch": {
    "provider": "openrouter",
    "id": "deepseek/deepseek-v4.1-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/dots-studio/dots-3-note-preview:free": {
    "provider": "openrouter",
    "id": "dots-studio/dots-3-note-preview:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 512000,
    "maxOutputTokens": 460800
  },
  "openrouter/google/gemini-2.5-flash": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65535
  },
  "openrouter/google/gemini-2.5-flash-lite": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-flash-lite",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65535
  },
  "openrouter/google/gemini-2.5-flash-lite:batch": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-flash-lite:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65535
  },
  "openrouter/google/gemini-2.5-flash:batch": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65535
  },
  "openrouter/google/gemini-2.5-pro": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-2.5-pro-preview": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-pro-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-2.5-pro:batch": {
    "provider": "openrouter",
    "id": "google/gemini-2.5-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3-flash-preview": {
    "provider": "openrouter",
    "id": "google/gemini-3-flash-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3-flash-preview:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3-flash-preview:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3-pro-image": {
    "provider": "openrouter",
    "id": "google/gemini-3-pro-image",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 32768
  },
  "openrouter/google/gemini-3.1-flash-lite": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-flash-lite",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.1-flash-lite-preview": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-flash-lite-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.1-flash-lite:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-flash-lite:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.1-pro-preview": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-pro-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.1-pro-preview-customtools": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-pro-preview-customtools",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.1-pro-preview:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.1-pro-preview:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.5-flash": {
    "provider": "openrouter",
    "id": "google/gemini-3.5-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.5-flash-lite": {
    "provider": "openrouter",
    "id": "google/gemini-3.5-flash-lite",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.5-flash-lite:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.5-flash-lite:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.5-flash:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.5-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.6-flash": {
    "provider": "openrouter",
    "id": "google/gemini-3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.6-flash:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.6-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.7-flash": {
    "provider": "openrouter",
    "id": "google/gemini-3.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.7-flash:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.7-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.8-flash": {
    "provider": "openrouter",
    "id": "google/gemini-3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemini-3.8-flash:batch": {
    "provider": "openrouter",
    "id": "google/gemini-3.8-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/google/gemma-3-12b-it": {
    "provider": "openrouter",
    "id": "google/gemma-3-12b-it",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/google/gemma-3-27b-it": {
    "provider": "openrouter",
    "id": "google/gemma-3-27b-it",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/google/gemma-4-26b-a4b-it": {
    "provider": "openrouter",
    "id": "google/gemma-4-26b-a4b-it",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/google/gemma-4-26b-a4b-it:free": {
    "provider": "openrouter",
    "id": "google/gemma-4-26b-a4b-it:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/google/gemma-4-31b-it": {
    "provider": "openrouter",
    "id": "google/gemma-4-31b-it",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "openrouter/google/gemma-4-31b-it:free": {
    "provider": "openrouter",
    "id": "google/gemma-4-31b-it:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/ibm-granite/granite-4.2-8b": {
    "provider": "openrouter",
    "id": "ibm-granite/granite-4.2-8b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/inception/mercury-2": {
    "provider": "openrouter",
    "id": "inception/mercury-2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 50000
  },
  "openrouter/inception/mercury-2.5": {
    "provider": "openrouter",
    "id": "inception/mercury-2.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 260000,
    "maxOutputTokens": 65536
  },
  "openrouter/inclusionai/ling-3.0-flash": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/inclusionai/ling-3.0-flash-fin": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash-fin",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/inclusionai/ling-3.0-flash-fin:free": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash-fin:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/inclusionai/ling-3.0-flash-sante:free": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash-sante:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/inclusionai/ling-3.0-flash-vl": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash-vl",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/inclusionai/ling-3.0-flash-vl:free": {
    "provider": "openrouter",
    "id": "inclusionai/ling-3.0-flash-vl:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/kwaipilot/kat-coder-pro-v2.5": {
    "provider": "openrouter",
    "id": "kwaipilot/kat-coder-pro-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/liquid/lfm-2.5-2.6b:free": {
    "provider": "openrouter",
    "id": "liquid/lfm-2.5-2.6b:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 8192
  },
  "openrouter/meituan/longcat-2.0": {
    "provider": "openrouter",
    "id": "meituan/longcat-2.0",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048756,
    "maxOutputTokens": 262144
  },
  "openrouter/meta-llama/llama-3.1-70b-instruct": {
    "provider": "openrouter",
    "id": "meta-llama/llama-3.1-70b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/meta-llama/llama-3.1-8b-instruct": {
    "provider": "openrouter",
    "id": "meta-llama/llama-3.1-8b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/meta-llama/llama-3.3-70b-instruct": {
    "provider": "openrouter",
    "id": "meta-llama/llama-3.3-70b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/meta-llama/llama-4-maverick": {
    "provider": "openrouter",
    "id": "meta-llama/llama-4-maverick",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/meta-llama/llama-4-scout": {
    "provider": "openrouter",
    "id": "meta-llama/llama-4-scout",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 327680,
    "maxOutputTokens": 16384
  },
  "openrouter/meta/muse-glimmer-30b": {
    "provider": "openrouter",
    "id": "meta/muse-glimmer-30b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/meta/muse-spark-1.1": {
    "provider": "openrouter",
    "id": "meta/muse-spark-1.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/meta/muse-spark-1.2": {
    "provider": "openrouter",
    "id": "meta/muse-spark-1.2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/meta/muse-spark-1.2-contributor": {
    "provider": "openrouter",
    "id": "meta/muse-spark-1.2-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/meta/muse-spark-1.3": {
    "provider": "openrouter",
    "id": "meta/muse-spark-1.3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/meta/muse-spark-1.3-contributor": {
    "provider": "openrouter",
    "id": "meta/muse-spark-1.3-contributor",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/minimax/minimax-m1": {
    "provider": "openrouter",
    "id": "minimax/minimax-m1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 40000
  },
  "openrouter/minimax/minimax-m2": {
    "provider": "openrouter",
    "id": "minimax/minimax-m2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "openrouter/minimax/minimax-m2.1": {
    "provider": "openrouter",
    "id": "minimax/minimax-m2.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "openrouter/minimax/minimax-m2.5": {
    "provider": "openrouter",
    "id": "minimax/minimax-m2.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 128000
  },
  "openrouter/minimax/minimax-m2.7": {
    "provider": "openrouter",
    "id": "minimax/minimax-m2.7",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "openrouter/minimax/minimax-m3": {
    "provider": "openrouter",
    "id": "minimax/minimax-m3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 512000
  },
  "openrouter/mistralai/codestral-2508": {
    "provider": "openrouter",
    "id": "mistralai/codestral-2508",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 204800
  },
  "openrouter/mistralai/codestral-2508:batch": {
    "provider": "openrouter",
    "id": "mistralai/codestral-2508:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 204800
  },
  "openrouter/mistralai/devstral-2512": {
    "provider": "openrouter",
    "id": "mistralai/devstral-2512",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/ministral-14b-2512": {
    "provider": "openrouter",
    "id": "mistralai/ministral-14b-2512",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/ministral-3b-2512": {
    "provider": "openrouter",
    "id": "mistralai/ministral-3b-2512",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 104857
  },
  "openrouter/mistralai/ministral-8b-2512": {
    "provider": "openrouter",
    "id": "mistralai/ministral-8b-2512",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/ministral-8b-2512:batch": {
    "provider": "openrouter",
    "id": "mistralai/ministral-8b-2512:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-large": {
    "provider": "openrouter",
    "id": "mistralai/mistral-large",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 102400
  },
  "openrouter/mistralai/mistral-large-2407": {
    "provider": "openrouter",
    "id": "mistralai/mistral-large-2407",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 104857
  },
  "openrouter/mistralai/mistral-large-2512:batch": {
    "provider": "openrouter",
    "id": "mistralai/mistral-large-2512:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-medium-3": {
    "provider": "openrouter",
    "id": "mistralai/mistral-medium-3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 104857
  },
  "openrouter/mistralai/mistral-medium-3-5": {
    "provider": "openrouter",
    "id": "mistralai/mistral-medium-3-5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-medium-3-5:batch": {
    "provider": "openrouter",
    "id": "mistralai/mistral-medium-3-5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-medium-3.1": {
    "provider": "openrouter",
    "id": "mistralai/mistral-medium-3.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 104857
  },
  "openrouter/mistralai/mistral-medium-3.1:batch": {
    "provider": "openrouter",
    "id": "mistralai/mistral-medium-3.1:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 104857
  },
  "openrouter/mistralai/mistral-nemo": {
    "provider": "openrouter",
    "id": "mistralai/mistral-nemo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/mistralai/mistral-saba": {
    "provider": "openrouter",
    "id": "mistralai/mistral-saba",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 26214
  },
  "openrouter/mistralai/mistral-small-2603": {
    "provider": "openrouter",
    "id": "mistralai/mistral-small-2603",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-small-2603:batch": {
    "provider": "openrouter",
    "id": "mistralai/mistral-small-2603:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 209715
  },
  "openrouter/mistralai/mistral-small-3.1-24b-instruct": {
    "provider": "openrouter",
    "id": "mistralai/mistral-small-3.1-24b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 102400
  },
  "openrouter/mistralai/mistral-small-3.2-24b-instruct": {
    "provider": "openrouter",
    "id": "mistralai/mistral-small-3.2-24b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 16384
  },
  "openrouter/mistralai/mixtral-8x22b-instruct": {
    "provider": "openrouter",
    "id": "mistralai/mixtral-8x22b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 52428
  },
  "openrouter/mistralai/voxtral-small-24b-2507": {
    "provider": "openrouter",
    "id": "mistralai/voxtral-small-24b-2507",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 26214
  },
  "openrouter/moonshotai/kimi-k2": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 98304
  },
  "openrouter/moonshotai/kimi-k2-0905": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2-0905",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 98304
  },
  "openrouter/moonshotai/kimi-k2-thinking": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 98304
  },
  "openrouter/moonshotai/kimi-k2.5": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 4096
  },
  "openrouter/moonshotai/kimi-k2.6": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/moonshotai/kimi-k2.7-code": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/moonshotai/kimi-k3": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/moonshotai/kimi-k3:batch": {
    "provider": "openrouter",
    "id": "moonshotai/kimi-k3:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 16384
  },
  "openrouter/nex-agi/nex-n2.5-mini:free": {
    "provider": "openrouter",
    "id": "nex-agi/nex-n2.5-mini:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nex-agi/nex-n2.5-pro": {
    "provider": "openrouter",
    "id": "nex-agi/nex-n2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nex-agi/nex-n2.5-pro:free": {
    "provider": "openrouter",
    "id": "nex-agi/nex-n2.5-pro:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nvidia/nemotron-3-nano-30b-a3b": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-nano-30b-a3b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 65536
  },
  "openrouter/nvidia/nemotron-3-super-120b-a12b": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-super-120b-a12b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nvidia/nemotron-3-super-120b-a12b:free": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-super-120b-a12b:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nvidia/nemotron-3-ultra-550b-a55b": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 202800,
    "maxOutputTokens": 182520
  },
  "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/nvidia/nemotron-3.5-lightning": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3.5-lightning",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/nvidia/nemotron-3.5-lightning:free": {
    "provider": "openrouter",
    "id": "nvidia/nemotron-3.5-lightning:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/openai/gpt-3.5-turbo": {
    "provider": "openrouter",
    "id": "openai/gpt-3.5-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 16385,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-3.5-turbo-0613": {
    "provider": "openrouter",
    "id": "openai/gpt-3.5-turbo-0613",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 4095,
    "maxOutputTokens": 3685
  },
  "openrouter/openai/gpt-3.5-turbo-16k": {
    "provider": "openrouter",
    "id": "openai/gpt-3.5-turbo-16k",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 16385,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-3.5-turbo:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-3.5-turbo:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 16385,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-4": {
    "provider": "openrouter",
    "id": "openai/gpt-4",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 8191,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-4-turbo": {
    "provider": "openrouter",
    "id": "openai/gpt-4-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-4-turbo:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4-turbo:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-4.1": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4.1-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4.1-mini:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4.1-nano": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1-nano",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4.1-nano:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1-nano:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4.1:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4.1:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-4o": {
    "provider": "openrouter",
    "id": "openai/gpt-4o",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o-2024-05-13": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-2024-05-13",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "openrouter/openai/gpt-4o-2024-08-06": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-2024-08-06",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o-2024-11-20": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-2024-11-20",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o-mini-2024-07-18": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-mini-2024-07-18",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o-mini:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4o-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-4o:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-4o:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-5": {
    "provider": "openrouter",
    "id": "openai/gpt-5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-5-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-mini:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-nano": {
    "provider": "openrouter",
    "id": "openai/gpt-5-nano",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-nano:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5-nano:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.1": {
    "provider": "openrouter",
    "id": "openai/gpt-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.1-codex": {
    "provider": "openrouter",
    "id": "openai/gpt-5.1-codex",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.1-codex-max": {
    "provider": "openrouter",
    "id": "openai/gpt-5.1-codex-max",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.1-codex-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-5.1-codex-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.1:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.1:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.2": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.2-chat": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2-chat",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 32000
  },
  "openrouter/openai/gpt-5.2-codex": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2-codex",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.2-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.2-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.2:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.2:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.3-codex": {
    "provider": "openrouter",
    "id": "openai/gpt-5.3-codex",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-mini:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-nano": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-nano",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-nano:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-nano:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.4:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.4:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.5": {
    "provider": "openrouter",
    "id": "openai/gpt-5.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.5-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.5-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.5-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.5:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-luna": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-luna-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-luna-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-luna-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-luna-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-luna:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-luna:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-sol": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-sol-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-sol-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-sol-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-sol-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-sol:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-sol:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-terra": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-terra",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-terra-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-terra-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-terra-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-terra-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5.6-terra:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5.6-terra:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-5:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-5:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-astra": {
    "provider": "openrouter",
    "id": "openai/gpt-6-astra",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-astra-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-6-astra-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-astra-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-astra-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-astra:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-astra:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-luna": {
    "provider": "openrouter",
    "id": "openai/gpt-6-luna",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-luna-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-6-luna-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-luna-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-luna-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-luna:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-luna:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-sol": {
    "provider": "openrouter",
    "id": "openai/gpt-6-sol",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-sol-pro": {
    "provider": "openrouter",
    "id": "openai/gpt-6-sol-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-sol-pro:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-sol-pro:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-6-sol:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-6-sol:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-audio": {
    "provider": "openrouter",
    "id": "openai/gpt-audio",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-audio-mini": {
    "provider": "openrouter",
    "id": "openai/gpt-audio-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "openrouter/openai/gpt-chat-latest": {
    "provider": "openrouter",
    "id": "openai/gpt-chat-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/openai/gpt-oss-120b": {
    "provider": "openrouter",
    "id": "openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "openrouter/openai/gpt-oss-20b": {
    "provider": "openrouter",
    "id": "openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/openai/gpt-oss-20b:batch": {
    "provider": "openrouter",
    "id": "openai/gpt-oss-20b:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/openai/gpt-oss-safeguard-20b": {
    "provider": "openrouter",
    "id": "openai/gpt-oss-safeguard-20b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "openrouter/openai/o1": {
    "provider": "openrouter",
    "id": "openai/o1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3": {
    "provider": "openrouter",
    "id": "openai/o3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3-mini": {
    "provider": "openrouter",
    "id": "openai/o3-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3-mini-high": {
    "provider": "openrouter",
    "id": "openai/o3-mini-high",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3-mini:batch": {
    "provider": "openrouter",
    "id": "openai/o3-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3-pro": {
    "provider": "openrouter",
    "id": "openai/o3-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o3:batch": {
    "provider": "openrouter",
    "id": "openai/o3:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o4-mini": {
    "provider": "openrouter",
    "id": "openai/o4-mini",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o4-mini-high": {
    "provider": "openrouter",
    "id": "openai/o4-mini-high",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openai/o4-mini:batch": {
    "provider": "openrouter",
    "id": "openai/o4-mini:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "openrouter/openrouter/auto": {
    "provider": "openrouter",
    "id": "openrouter/auto",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 2000000,
    "maxOutputTokens": 4096
  },
  "openrouter/openrouter/auto-beta": {
    "provider": "openrouter",
    "id": "openrouter/auto-beta",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 2000000,
    "maxOutputTokens": 4096
  },
  "openrouter/openrouter/free": {
    "provider": "openrouter",
    "id": "openrouter/free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 4096
  },
  "openrouter/openrouter/fusion": {
    "provider": "openrouter",
    "id": "openrouter/fusion",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 30000
  },
  "openrouter/poolside/laguna-s-2.1": {
    "provider": "openrouter",
    "id": "poolside/laguna-s-2.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/poolside/laguna-s-2.1:free": {
    "provider": "openrouter",
    "id": "poolside/laguna-s-2.1:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/poolside/laguna-xs-2.1": {
    "provider": "openrouter",
    "id": "poolside/laguna-xs-2.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/poolside/laguna-xs-2.1:free": {
    "provider": "openrouter",
    "id": "poolside/laguna-xs-2.1:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/prism-ml/ternary-bonsai-2-27b": {
    "provider": "openrouter",
    "id": "prism-ml/ternary-bonsai-2-27b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen-2.5-72b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen-2.5-72b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen-2.5-7b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen-2.5-7b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 29491
  },
  "openrouter/qwen/qwen-plus": {
    "provider": "openrouter",
    "id": "qwen/qwen-plus",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen-plus-2025-07-28": {
    "provider": "openrouter",
    "id": "qwen/qwen-plus-2025-07-28",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-14b": {
    "provider": "openrouter",
    "id": "qwen/qwen3-14b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen3-235b-a22b": {
    "provider": "openrouter",
    "id": "qwen/qwen3-235b-a22b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 8192
  },
  "openrouter/qwen/qwen3-235b-a22b-2507": {
    "provider": "openrouter",
    "id": "qwen/qwen3-235b-a22b-2507",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3-235b-a22b-thinking-2507": {
    "provider": "openrouter",
    "id": "qwen/qwen3-235b-a22b-thinking-2507",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/qwen/qwen3-30b-a3b": {
    "provider": "openrouter",
    "id": "qwen/qwen3-30b-a3b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen3-30b-a3b-instruct-2507": {
    "provider": "openrouter",
    "id": "qwen/qwen3-30b-a3b-instruct-2507",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 128000,
    "maxOutputTokens": 32000
  },
  "openrouter/qwen/qwen3-30b-a3b-thinking-2507": {
    "provider": "openrouter",
    "id": "qwen/qwen3-30b-a3b-thinking-2507",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 81920,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-32b": {
    "provider": "openrouter",
    "id": "qwen/qwen3-32b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen3-8b": {
    "provider": "openrouter",
    "id": "qwen/qwen3-8b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 8192
  },
  "openrouter/qwen/qwen3-coder": {
    "provider": "openrouter",
    "id": "qwen/qwen3-coder",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3-coder-30b-a3b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-coder-30b-a3b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3-coder-flash": {
    "provider": "openrouter",
    "id": "qwen/qwen3-coder-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3-coder-next": {
    "provider": "openrouter",
    "id": "qwen/qwen3-coder-next",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3-coder-plus": {
    "provider": "openrouter",
    "id": "qwen/qwen3-coder-plus",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3-max": {
    "provider": "openrouter",
    "id": "qwen/qwen3-max",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3-max-thinking": {
    "provider": "openrouter",
    "id": "qwen/qwen3-max-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3-next-80b-a3b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-next-80b-a3b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen3-next-80b-a3b-thinking": {
    "provider": "openrouter",
    "id": "qwen/qwen3-next-80b-a3b-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3-vl-235b-a22b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-235b-a22b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-235b-a22b-thinking": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-235b-a22b-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-30b-a3b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-30b-a3b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-30b-a3b-thinking": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-30b-a3b-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-32b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-32b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-8b-instruct": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-8b-instruct",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3-vl-8b-thinking": {
    "provider": "openrouter",
    "id": "qwen/qwen3-vl-8b-thinking",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3.5-122b-a10b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-122b-a10b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.5-27b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-27b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.5-35b-a3b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-35b-a3b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 16384
  },
  "openrouter/qwen/qwen3.5-397b-a17b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-397b-a17b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3.5-9b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-9b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 32768
  },
  "openrouter/qwen/qwen3.5-flash-02-23": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-flash-02-23",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.5-plus-02-15": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-plus-02-15",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.5-plus-20260420": {
    "provider": "openrouter",
    "id": "qwen/qwen3.5-plus-20260420",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.6-27b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.6-27b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262140
  },
  "openrouter/qwen/qwen3.6-35b-a3b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.6-35b-a3b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3.6-flash": {
    "provider": "openrouter",
    "id": "qwen/qwen3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.6-max-preview": {
    "provider": "openrouter",
    "id": "qwen/qwen3.6-max-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.6-plus": {
    "provider": "openrouter",
    "id": "qwen/qwen3.6-plus",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.7-flash": {
    "provider": "openrouter",
    "id": "qwen/qwen3.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "openrouter/qwen/qwen3.7-max": {
    "provider": "openrouter",
    "id": "qwen/qwen3.7-max",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.7-plus": {
    "provider": "openrouter",
    "id": "qwen/qwen3.7-plus",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.8-2.4t-a95b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-2.4t-a95b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.8-27b": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-27b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.8-27b:free": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-27b:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/qwen/qwen3.8-flash": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.8-max-0902": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-max-0902",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/qwen/qwen3.8-omni-flash": {
    "provider": "openrouter",
    "id": "qwen/qwen3.8-omni-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "openrouter/rekaai/reka-edge": {
    "provider": "openrouter",
    "id": "rekaai/reka-edge",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 16384,
    "maxOutputTokens": 14745
  },
  "openrouter/relace/relace-search": {
    "provider": "openrouter",
    "id": "relace/relace-search",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 128000
  },
  "openrouter/sakana/fugu-max": {
    "provider": "openrouter",
    "id": "sakana/fugu-max",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/sakana/fugu-ultra": {
    "provider": "openrouter",
    "id": "sakana/fugu-ultra",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/sakana/fugu-ultra-v2": {
    "provider": "openrouter",
    "id": "sakana/fugu-ultra-v2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/sakana/sakana-namazu": {
    "provider": "openrouter",
    "id": "sakana/sakana-namazu",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/sao10k/l3.1-euryale-70b": {
    "provider": "openrouter",
    "id": "sao10k/l3.1-euryale-70b",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 16384
  },
  "openrouter/stepfun/step-3.5-flash": {
    "provider": "openrouter",
    "id": "stepfun/step-3.5-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "openrouter/stepfun/step-3.7-flash": {
    "provider": "openrouter",
    "id": "stepfun/step-3.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 230400
  },
  "openrouter/tencent/hy3": {
    "provider": "openrouter",
    "id": "tencent/hy3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 128000
  },
  "openrouter/tencent/hy3-preview": {
    "provider": "openrouter",
    "id": "tencent/hy3-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 235929
  },
  "openrouter/tencent/hy4-preview": {
    "provider": "openrouter",
    "id": "tencent/hy4-preview",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 64000
  },
  "openrouter/thinkingmachines/inkling": {
    "provider": "openrouter",
    "id": "thinkingmachines/inkling",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 471859
  },
  "openrouter/thinkingmachines/inkling-small": {
    "provider": "openrouter",
    "id": "thinkingmachines/inkling-small",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 262144
  },
  "openrouter/thinkingmachines/inkling-small:free": {
    "provider": "openrouter",
    "id": "thinkingmachines/inkling-small:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "openrouter/thinkingmachines/inkling:free": {
    "provider": "openrouter",
    "id": "thinkingmachines/inkling:free",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "openrouter/unbiased/pareto": {
    "provider": "openrouter",
    "id": "unbiased/pareto",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "openrouter/upstage/solar-pro-3": {
    "provider": "openrouter",
    "id": "upstage/solar-pro-3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/upstage/solar-pro4": {
    "provider": "openrouter",
    "id": "upstage/solar-pro4",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 131072
  },
  "openrouter/x-ai/grok-4.20": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.20",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 2000000,
    "maxOutputTokens": 1800000
  },
  "openrouter/x-ai/grok-4.3": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 900000
  },
  "openrouter/x-ai/grok-4.3:batch": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.3:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 900000
  },
  "openrouter/x-ai/grok-4.5": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 450000
  },
  "openrouter/x-ai/grok-4.6": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 450000
  },
  "openrouter/x-ai/grok-4.7": {
    "provider": "openrouter",
    "id": "x-ai/grok-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 450000
  },
  "openrouter/x-ai/grok-build-0.1": {
    "provider": "openrouter",
    "id": "x-ai/grok-build-0.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 256000,
    "maxOutputTokens": 230400
  },
  "openrouter/xiaomi/mimo-v2.5": {
    "provider": "openrouter",
    "id": "xiaomi/mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/xiaomi/mimo-v2.5-pro": {
    "provider": "openrouter",
    "id": "xiaomi/mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/xiaomi/mimo-v2.6-flash": {
    "provider": "openrouter",
    "id": "xiaomi/mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/xiaomi/mimo-v2.6-pro": {
    "provider": "openrouter",
    "id": "xiaomi/mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/xiaomi/mimo-v2.6-pro-ultraspeed": {
    "provider": "openrouter",
    "id": "xiaomi/mimo-v2.6-pro-ultraspeed",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-4.5": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 98304
  },
  "openrouter/z-ai/glm-4.5-air": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.5-air",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 98304
  },
  "openrouter/z-ai/glm-4.5v": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.5v",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 65536,
    "maxOutputTokens": 16384
  },
  "openrouter/z-ai/glm-4.6": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 198000,
    "maxOutputTokens": 16384
  },
  "openrouter/z-ai/glm-4.6v": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.6v",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "openrouter/z-ai/glm-4.7": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-4.7-flash": {
    "provider": "openrouter",
    "id": "z-ai/glm-4.7-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 117964
  },
  "openrouter/z-ai/glm-5": {
    "provider": "openrouter",
    "id": "z-ai/glm-5",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 198000,
    "maxOutputTokens": 128000
  },
  "openrouter/z-ai/glm-5-turbo": {
    "provider": "openrouter",
    "id": "z-ai/glm-5-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5.1": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 128000
  },
  "openrouter/z-ai/glm-5.2": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5.3": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5.3-flash": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/z-ai/glm-5.3-flash:batch": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.3-flash:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5.3-flashx": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.3-flashx",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5.3:batch": {
    "provider": "openrouter",
    "id": "z-ai/glm-5.3:batch",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/z-ai/glm-5v-turbo": {
    "provider": "openrouter",
    "id": "z-ai/glm-5v-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "openrouter/~anthropic/claude-fable-latest": {
    "provider": "openrouter",
    "id": "~anthropic/claude-fable-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/~anthropic/claude-haiku-latest": {
    "provider": "openrouter",
    "id": "~anthropic/claude-haiku-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "openrouter/~anthropic/claude-opus-latest": {
    "provider": "openrouter",
    "id": "~anthropic/claude-opus-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/~anthropic/claude-sonnet-latest": {
    "provider": "openrouter",
    "id": "~anthropic/claude-sonnet-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "openrouter/~deepseek/deepseek-flash-latest": {
    "provider": "openrouter",
    "id": "~deepseek/deepseek-flash-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/~deepseek/deepseek-pro-latest": {
    "provider": "openrouter",
    "id": "~deepseek/deepseek-pro-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 393216
  },
  "openrouter/~deepseek/deepseek-v4-flash-latest": {
    "provider": "openrouter",
    "id": "~deepseek/deepseek-v4-flash-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/~google/gemini-flash-latest": {
    "provider": "openrouter",
    "id": "~google/gemini-flash-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/~google/gemini-pro-latest": {
    "provider": "openrouter",
    "id": "~google/gemini-pro-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "openrouter/~moonshotai/kimi-latest": {
    "provider": "openrouter",
    "id": "~moonshotai/kimi-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "openrouter/~openai/gpt-astra-latest": {
    "provider": "openrouter",
    "id": "~openai/gpt-astra-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/~openai/gpt-luna-latest": {
    "provider": "openrouter",
    "id": "~openai/gpt-luna-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/~openai/gpt-mini-latest": {
    "provider": "openrouter",
    "id": "~openai/gpt-mini-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "openrouter/~openai/gpt-sol-latest": {
    "provider": "openrouter",
    "id": "~openai/gpt-sol-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/~openai/gpt-terra-latest": {
    "provider": "openrouter",
    "id": "~openai/gpt-terra-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "openrouter/~x-ai/grok-latest": {
    "provider": "openrouter",
    "id": "~x-ai/grok-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 450000
  },
  "openrouter/~z-ai/glm-flash-latest": {
    "provider": "openrouter",
    "id": "~z-ai/glm-flash-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 943718
  },
  "openrouter/~z-ai/glm-latest": {
    "provider": "openrouter",
    "id": "~z-ai/glm-latest",
    "protocol": "openai-completions",
    "endpoint": "https://openrouter.ai/api/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan/MiniMax-M2.5": {
    "provider": "qwen-token-plan",
    "id": "MiniMax-M2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 196608,
    "maxOutputTokens": 32768
  },
  "qwen-token-plan/deepseek-v3.2": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v3.2",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan/deepseek-v4-flash": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v4-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan/deepseek-v4-flash-0731": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan/deepseek-v4-pro": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan/deepseek-v4-pro-0813": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan/deepseek-v4.1-flash": {
    "provider": "qwen-token-plan",
    "id": "deepseek-v4.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan/glm-5": {
    "provider": "qwen-token-plan",
    "id": "glm-5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 16384
  },
  "qwen-token-plan/glm-5.1": {
    "provider": "qwen-token-plan",
    "id": "glm-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 128000
  },
  "qwen-token-plan/glm-5.2": {
    "provider": "qwen-token-plan",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan/glm-5.3": {
    "provider": "qwen-token-plan",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan/kimi-k2.5": {
    "provider": "qwen-token-plan",
    "id": "kimi-k2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 98304
  },
  "qwen-token-plan/kimi-k2.6": {
    "provider": "qwen-token-plan",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "qwen-token-plan/kimi-k2.7-code": {
    "provider": "qwen-token-plan",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "qwen-token-plan/qwen3.6-flash": {
    "provider": "qwen-token-plan",
    "id": "qwen3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan/qwen3.6-plus": {
    "provider": "qwen-token-plan",
    "id": "qwen3.6-plus",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan/qwen3.7-max": {
    "provider": "qwen-token-plan",
    "id": "qwen3.7-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan/qwen3.7-plus": {
    "provider": "qwen-token-plan",
    "id": "qwen3.7-plus",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan/qwen3.8-flash": {
    "provider": "qwen-token-plan",
    "id": "qwen3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan/qwen3.8-max": {
    "provider": "qwen-token-plan",
    "id": "qwen3.8-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-cn/MiniMax-M2.5": {
    "provider": "qwen-token-plan-cn",
    "id": "MiniMax-M2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 196608,
    "maxOutputTokens": 32768
  },
  "qwen-token-plan-cn/deepseek-v3.2": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v3.2",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-cn/deepseek-v4-flash": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v4-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-cn/deepseek-v4-flash-0731": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-cn/deepseek-v4-pro": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-cn/deepseek-v4-pro-0813": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-cn/deepseek-v4.1-flash": {
    "provider": "qwen-token-plan-cn",
    "id": "deepseek-v4.1-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-cn/glm-5": {
    "provider": "qwen-token-plan-cn",
    "id": "glm-5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 16384
  },
  "qwen-token-plan-cn/glm-5.1": {
    "provider": "qwen-token-plan-cn",
    "id": "glm-5.1",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 128000
  },
  "qwen-token-plan-cn/glm-5.2": {
    "provider": "qwen-token-plan-cn",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-cn/glm-5.3": {
    "provider": "qwen-token-plan-cn",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-cn/kimi-k2.5": {
    "provider": "qwen-token-plan-cn",
    "id": "kimi-k2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 98304
  },
  "qwen-token-plan-cn/kimi-k2.6": {
    "provider": "qwen-token-plan-cn",
    "id": "kimi-k2.6",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "qwen-token-plan-cn/kimi-k2.7-code": {
    "provider": "qwen-token-plan-cn",
    "id": "kimi-k2.7-code",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "qwen-token-plan-cn/qwen3.6-flash": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-cn/qwen3.6-plus": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.6-plus",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-cn/qwen3.7-max": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.7-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-cn/qwen3.7-plus": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.7-plus",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-cn/qwen3.8-flash": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-cn/qwen3.8-max": {
    "provider": "qwen-token-plan-cn",
    "id": "qwen3.8-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-individual/deepseek-v4-flash-0731": {
    "provider": "qwen-token-plan-individual",
    "id": "deepseek-v4-flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-individual/deepseek-v4-pro": {
    "provider": "qwen-token-plan-individual",
    "id": "deepseek-v4-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-individual/deepseek-v4-pro-0813": {
    "provider": "qwen-token-plan-individual",
    "id": "deepseek-v4-pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "qwen-token-plan-individual/glm-5.2": {
    "provider": "qwen-token-plan-individual",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-individual/qwen3.6-flash": {
    "provider": "qwen-token-plan-individual",
    "id": "qwen3.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-individual/qwen3.7-max": {
    "provider": "qwen-token-plan-individual",
    "id": "qwen3.7-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-individual/qwen3.7-plus": {
    "provider": "qwen-token-plan-individual",
    "id": "qwen3.7-plus",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "qwen-token-plan-individual/qwen3.8-flash": {
    "provider": "qwen-token-plan-individual",
    "id": "qwen3.8-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "qwen-token-plan-individual/qwen3.8-max": {
    "provider": "qwen-token-plan-individual",
    "id": "qwen3.8-max",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "together/MiniMaxAI/MiniMax-M2.7": {
    "provider": "together",
    "id": "MiniMaxAI/MiniMax-M2.7",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 202752,
    "maxOutputTokens": 131072
  },
  "together/MiniMaxAI/MiniMax-M3": {
    "provider": "together",
    "id": "MiniMaxAI/MiniMax-M3",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 250000
  },
  "together/Qwen/Qwen2.5-7B-Instruct-Turbo": {
    "provider": "together",
    "id": "Qwen/Qwen2.5-7B-Instruct-Turbo",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 32768,
    "maxOutputTokens": 32768
  },
  "together/Qwen/Qwen3.5-9B": {
    "provider": "together",
    "id": "Qwen/Qwen3.5-9B",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "together/Qwen/Qwen3.6-Plus": {
    "provider": "together",
    "id": "Qwen/Qwen3.6-Plus",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 500000
  },
  "together/Qwen/Qwen3.7-Max": {
    "provider": "together",
    "id": "Qwen/Qwen3.7-Max",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 500000
  },
  "together/deepseek-ai/DeepSeek-V4-Flash-0731": {
    "provider": "together",
    "id": "deepseek-ai/DeepSeek-V4-Flash-0731",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "together/deepseek-ai/DeepSeek-V4-Pro": {
    "provider": "together",
    "id": "deepseek-ai/DeepSeek-V4-Pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 512000,
    "maxOutputTokens": 384000
  },
  "together/deepseek-ai/DeepSeek-V4-Pro-0813": {
    "provider": "together",
    "id": "deepseek-ai/DeepSeek-V4-Pro-0813",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "together/deepseek-ai/DeepSeek-V4.1-Flash": {
    "provider": "together",
    "id": "deepseek-ai/DeepSeek-V4.1-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 384000
  },
  "together/google/gemma-4-31B-it": {
    "provider": "together",
    "id": "google/gemma-4-31B-it",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "together/meta-llama/Llama-3.3-70B-Instruct-Turbo": {
    "provider": "together",
    "id": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "together/moonshotai/Kimi-K2.6": {
    "provider": "together",
    "id": "moonshotai/Kimi-K2.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131000
  },
  "together/moonshotai/Kimi-K2.7-Code": {
    "provider": "together",
    "id": "moonshotai/Kimi-K2.7-Code",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "together/moonshotai/Kimi-K3": {
    "provider": "together",
    "id": "moonshotai/Kimi-K3",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "together/nvidia/nemotron-3-ultra-550b-a55b": {
    "provider": "together",
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 512300,
    "maxOutputTokens": 512300
  },
  "together/openai/gpt-oss-120b": {
    "provider": "together",
    "id": "openai/gpt-oss-120b",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "together/openai/gpt-oss-20b": {
    "provider": "together",
    "id": "openai/gpt-oss-20b",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "together/thinkingmachines/Inkling": {
    "provider": "together",
    "id": "thinkingmachines/Inkling",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 524288,
    "maxOutputTokens": 131072
  },
  "together/zai-org/GLM-5.2": {
    "provider": "together",
    "id": "zai-org/GLM-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 512000,
    "maxOutputTokens": 164000
  },
  "together/zai-org/GLM-5.3": {
    "provider": "together",
    "id": "zai-org/GLM-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "together/zai-org/GLM-5.3-Flash": {
    "provider": "together",
    "id": "zai-org/GLM-5.3-Flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.together.ai/v1",
    "contextWindow": 1048575,
    "maxOutputTokens": 400000
  },
  "vercel-ai-gateway/alibaba/qwen-3-14b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen-3-14b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/alibaba/qwen-3-235b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen-3-235b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/alibaba/qwen-3-30b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen-3-30b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 40960,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/alibaba/qwen-3-32b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen-3-32b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/alibaba/qwen-3.6-max-preview": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen-3.6-max-preview",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 240000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3-235b-a22b-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-235b-a22b-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/alibaba/qwen3-coder": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-coder",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/alibaba/qwen3-coder-30b-a3b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-coder-30b-a3b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/alibaba/qwen3-coder-next": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-coder-next",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/alibaba/qwen3-coder-plus": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-coder-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/alibaba/qwen3-max": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/alibaba/qwen3-max-preview": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-max-preview",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/alibaba/qwen3-max-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-max-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/alibaba/qwen3-next-80b-a3b-instruct": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-next-80b-a3b-instruct",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262114,
    "maxOutputTokens": 262114
  },
  "vercel-ai-gateway/alibaba/qwen3-next-80b-a3b-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-next-80b-a3b-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "vercel-ai-gateway/alibaba/qwen3-vl-235b-a22b-instruct": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-vl-235b-a22b-instruct",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 129024
  },
  "vercel-ai-gateway/alibaba/qwen3-vl-instruct": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-vl-instruct",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 129024
  },
  "vercel-ai-gateway/alibaba/qwen3-vl-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3-vl-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/alibaba/qwen3.5-flash": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.5-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.5-plus": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.5-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.6-27b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.6-27b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/alibaba/qwen3.6-plus": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.6-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.7-flash": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.7-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 991000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.7-max": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.7-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 991000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.7-plus": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.7-plus",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/alibaba/qwen3.8-2.4t-a95b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-2.4t-a95b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/alibaba/qwen3.8-27b": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-27b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/alibaba/qwen3.8-flash": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 991000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/alibaba/qwen3.8-max": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/alibaba/qwen3.8-max-0902": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-max-0902",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 991000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/alibaba/qwen3.8-omni-flash": {
    "provider": "vercel-ai-gateway",
    "id": "alibaba/qwen3.8-omni-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/amazon/nova-2-lite": {
    "provider": "vercel-ai-gateway",
    "id": "amazon/nova-2-lite",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/amazon/nova-lite": {
    "provider": "vercel-ai-gateway",
    "id": "amazon/nova-lite",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 300000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/amazon/nova-micro": {
    "provider": "vercel-ai-gateway",
    "id": "amazon/nova-micro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/amazon/nova-pro": {
    "provider": "vercel-ai-gateway",
    "id": "amazon/nova-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 300000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/anthropic/claude-3-haiku": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-3-haiku",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 4096
  },
  "vercel-ai-gateway/anthropic/claude-fable-5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-fable-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-fable-5.1": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-fable-5.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-haiku-4.5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-haiku-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/anthropic/claude-opus-4": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/anthropic/claude-opus-4.5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/anthropic/claude-opus-4.6": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-4.7": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-4.8": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4.8",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-4.8-fast": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-4.8-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-5-fast": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-5-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-5.5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-5.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-opus-5.5-fast": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-opus-5.5-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-sonnet-4": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-sonnet-4",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/anthropic/claude-sonnet-4.5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-sonnet-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/anthropic/claude-sonnet-4.6": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-sonnet-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/anthropic/claude-sonnet-5": {
    "provider": "vercel-ai-gateway",
    "id": "anthropic/claude-sonnet-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/arcee-ai/trinity-large-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "arcee-ai/trinity-large-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262100,
    "maxOutputTokens": 80000
  },
  "vercel-ai-gateway/bytedance/seed-1.6": {
    "provider": "vercel-ai-gateway",
    "id": "bytedance/seed-1.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/bytedance/seed-1.8": {
    "provider": "vercel-ai-gateway",
    "id": "bytedance/seed-1.8",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/bytedance/seed-2.1-turbo": {
    "provider": "vercel-ai-gateway",
    "id": "bytedance/seed-2.1-turbo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "vercel-ai-gateway/cohere/command-a": {
    "provider": "vercel-ai-gateway",
    "id": "cohere/command-a",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 8000
  },
  "vercel-ai-gateway/deepseek/deepseek-r1": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-r1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/deepseek/deepseek-v3.1": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v3.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 163840,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/deepseek/deepseek-v3.1-terminus": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v3.1-terminus",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/deepseek/deepseek-v3.2": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v3.2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8000
  },
  "vercel-ai-gateway/deepseek/deepseek-v3.2-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v3.2-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8000
  },
  "vercel-ai-gateway/deepseek/deepseek-v4-flash": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "vercel-ai-gateway/deepseek/deepseek-v4-flash-0731": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4-flash-0731",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "vercel-ai-gateway/deepseek/deepseek-v4-flash-vision-exp": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4-flash-vision-exp",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/deepseek/deepseek-v4-pro": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "vercel-ai-gateway/deepseek/deepseek-v4-pro-0813": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4-pro-0813",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 384000
  },
  "vercel-ai-gateway/deepseek/deepseek-v4.1-flash": {
    "provider": "vercel-ai-gateway",
    "id": "deepseek/deepseek-v4.1-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/google/gemini-2.5-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-2.5-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/google/gemini-2.5-flash-lite": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-2.5-flash-lite",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/google/gemini-2.5-pro": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-2.5-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/google/gemini-3-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65000
  },
  "vercel-ai-gateway/google/gemini-3.1-flash-lite": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.1-flash-lite",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65000
  },
  "vercel-ai-gateway/google/gemini-3.1-pro-preview": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.1-pro-preview",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/google/gemini-3.5-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.5-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/google/gemini-3.5-flash-lite": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.5-flash-lite",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65000
  },
  "vercel-ai-gateway/google/gemini-3.6-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.6-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/google/gemini-3.7-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.7-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/google/gemini-3.8-flash": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemini-3.8-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/google/gemma-4-26b-a4b-it": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemma-4-26b-a4b-it",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/google/gemma-4-31b-it": {
    "provider": "vercel-ai-gateway",
    "id": "google/gemma-4-31b-it",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/inception/mercury-2": {
    "provider": "vercel-ai-gateway",
    "id": "inception/mercury-2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/inception/mercury-2.5": {
    "provider": "vercel-ai-gateway",
    "id": "inception/mercury-2.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 260000,
    "maxOutputTokens": 65536
  },
  "vercel-ai-gateway/inception/mercury-coder-small": {
    "provider": "vercel-ai-gateway",
    "id": "inception/mercury-coder-small",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 32000,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-fin": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-fin",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-fin-free": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-fin-free",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-sante": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-sante",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-sante-free": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-sante-free",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-vl": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-vl",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/inclusionai/ling-3.0-flash-vl-free": {
    "provider": "vercel-ai-gateway",
    "id": "inclusionai/ling-3.0-flash-vl-free",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/interfaze/interfaze-beta": {
    "provider": "vercel-ai-gateway",
    "id": "interfaze/interfaze-beta",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/meta/llama-3.1-70b": {
    "provider": "vercel-ai-gateway",
    "id": "meta/llama-3.1-70b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/meta/llama-3.1-8b": {
    "provider": "vercel-ai-gateway",
    "id": "meta/llama-3.1-8b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/meta/llama-3.3-70b": {
    "provider": "vercel-ai-gateway",
    "id": "meta/llama-3.3-70b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/meta/llama-4-maverick": {
    "provider": "vercel-ai-gateway",
    "id": "meta/llama-4-maverick",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/meta/llama-4-scout": {
    "provider": "vercel-ai-gateway",
    "id": "meta/llama-4-scout",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/meta/muse-glimmer-30b": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-glimmer-30b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/meta/muse-spark-1.1": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-spark-1.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/meta/muse-spark-1.2": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-spark-1.2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/meta/muse-spark-1.2-contributor": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-spark-1.2-contributor",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/meta/muse-spark-1.3": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-spark-1.3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/meta/muse-spark-1.3-contributor": {
    "provider": "vercel-ai-gateway",
    "id": "meta/muse-spark-1.3-contributor",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 1048576
  },
  "vercel-ai-gateway/minimax/minimax-m2": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 205000,
    "maxOutputTokens": 205000
  },
  "vercel-ai-gateway/minimax/minimax-m2.1": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/minimax/minimax-m2.1-lightning": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.1-lightning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/minimax/minimax-m2.5": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/minimax/minimax-m2.5-highspeed": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.5-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/minimax/minimax-m2.7": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/minimax/minimax-m2.7-highspeed": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m2.7-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 204800,
    "maxOutputTokens": 131100
  },
  "vercel-ai-gateway/minimax/minimax-m3": {
    "provider": "vercel-ai-gateway",
    "id": "minimax/minimax-m3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 512000,
    "maxOutputTokens": 512000
  },
  "vercel-ai-gateway/mistral/codestral": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/codestral",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 4000
  },
  "vercel-ai-gateway/mistral/ministral-14b": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/ministral-14b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/mistral/ministral-3b": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/ministral-3b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 4000
  },
  "vercel-ai-gateway/mistral/ministral-8b": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/ministral-8b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 4000
  },
  "vercel-ai-gateway/mistral/mistral-large-3": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/mistral-large-3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/mistral/mistral-medium-3.5": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/mistral-medium-3.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/mistral/mistral-nemo": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/mistral-nemo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 60288,
    "maxOutputTokens": 16000
  },
  "vercel-ai-gateway/mistral/mistral-small": {
    "provider": "vercel-ai-gateway",
    "id": "mistral/mistral-small",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 4000
  },
  "vercel-ai-gateway/mixedbread/toast-1": {
    "provider": "vercel-ai-gateway",
    "id": "mixedbread/toast-1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131000,
    "maxOutputTokens": 4000
  },
  "vercel-ai-gateway/moonshotai/kimi-k2": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/moonshotai/kimi-k2-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 216144,
    "maxOutputTokens": 216144
  },
  "vercel-ai-gateway/moonshotai/kimi-k2.5": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/moonshotai/kimi-k2.6": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262000,
    "maxOutputTokens": 262000
  },
  "vercel-ai-gateway/moonshotai/kimi-k2.7-code": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2.7-code",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/moonshotai/kimi-k2.7-code-highspeed": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k2.7-code-highspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/moonshotai/kimi-k3": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/moonshotai/kimi-k3-fast": {
    "provider": "vercel-ai-gateway",
    "id": "moonshotai/kimi-k3-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/nvidia/nemotron-3-nano-30b-a3b": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-3-nano-30b-a3b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "vercel-ai-gateway/nvidia/nemotron-3-super-120b-a12b": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-3-super-120b-a12b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32000
  },
  "vercel-ai-gateway/nvidia/nemotron-3-ultra-550b-a55b": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 65000
  },
  "vercel-ai-gateway/nvidia/nemotron-3.5-lightning": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-3.5-lightning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/nvidia/nemotron-nano-12b-v2-vl": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-nano-12b-v2-vl",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/nvidia/nemotron-nano-9b-v2": {
    "provider": "vercel-ai-gateway",
    "id": "nvidia/nemotron-nano-9b-v2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/openai/gpt-3.5-turbo": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-3.5-turbo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 16385,
    "maxOutputTokens": 4096
  },
  "vercel-ai-gateway/openai/gpt-4-turbo": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4-turbo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 4096
  },
  "vercel-ai-gateway/openai/gpt-4.1": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4.1-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4.1-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4.1-mini-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1-mini-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4.1-nano": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1-nano",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4.1-nano-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4.1-nano-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1047576,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/openai/gpt-4o": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4o",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/openai/gpt-4o-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4o-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/openai/gpt-4o-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4o-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/openai/gpt-4o-mini-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-4o-mini-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16384
  },
  "vercel-ai-gateway/openai/gpt-5": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-codex": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-codex",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-mini-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-mini-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-nano": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-nano",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5-pro": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 272000
  },
  "vercel-ai-gateway/openai/gpt-5.1-codex": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.1-codex",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.1-codex-max": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.1-codex-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.1-codex-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.1-codex-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.1-thinking": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.1-thinking",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.1-thinking-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.1-thinking-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.2": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.2-codex": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.2-codex",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.2-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.2-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.2-pro": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.2-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.3-codex": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.3-codex",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.3-codex-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.3-codex-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4-mini-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4-mini-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4-nano": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4-nano",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 400000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.4-pro": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.4-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.5": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.5-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.5-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.5-pro": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.5-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-luna": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-luna",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-luna-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-luna-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-sol": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-sol",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-sol-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-sol-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-terra": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-terra",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-5.6-terra-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-5.6-terra-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-astra": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-astra",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-astra-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-astra-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-luna": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-luna",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-luna-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-luna-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-sol": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-sol",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-6-sol-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-6-sol-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/openai/gpt-oss-120b": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-oss-120b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/openai/gpt-oss-20b": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-oss-20b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 8192
  },
  "vercel-ai-gateway/openai/gpt-oss-safeguard-120b": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-oss-safeguard-120b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16000
  },
  "vercel-ai-gateway/openai/gpt-oss-safeguard-20b": {
    "provider": "vercel-ai-gateway",
    "id": "openai/gpt-oss-safeguard-20b",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 16000
  },
  "vercel-ai-gateway/openai/o1": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o3": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o3-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o3-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o3-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o3-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o3-pro": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o3-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o4-mini": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o4-mini",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/openai/o4-mini-fast": {
    "provider": "vercel-ai-gateway",
    "id": "openai/o4-mini-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 100000
  },
  "vercel-ai-gateway/poolside/laguna-s-2.1": {
    "provider": "vercel-ai-gateway",
    "id": "poolside/laguna-s-2.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/poolside/laguna-s-2.1-free": {
    "provider": "vercel-ai-gateway",
    "id": "poolside/laguna-s-2.1-free",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 32768
  },
  "vercel-ai-gateway/quiverai/arrow-2": {
    "provider": "vercel-ai-gateway",
    "id": "quiverai/arrow-2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/quiverai/arrow-2-telos": {
    "provider": "vercel-ai-gateway",
    "id": "quiverai/arrow-2-telos",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 131072,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/sakana/fugu-max": {
    "provider": "vercel-ai-gateway",
    "id": "sakana/fugu-max",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/sakana/fugu-ultra": {
    "provider": "vercel-ai-gateway",
    "id": "sakana/fugu-ultra",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/sakana/fugu-ultra-v2": {
    "provider": "vercel-ai-gateway",
    "id": "sakana/fugu-ultra-v2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/sakana/namazu": {
    "provider": "vercel-ai-gateway",
    "id": "sakana/namazu",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/spacexai/grok-4.1-fast-non-reasoning": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.1-fast-non-reasoning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/spacexai/grok-4.1-fast-reasoning": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.1-fast-reasoning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-multi-agent": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-multi-agent",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-multi-agent-beta": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-multi-agent-beta",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-non-reasoning": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-non-reasoning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-non-reasoning-beta": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-non-reasoning-beta",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-reasoning": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-reasoning",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.20-reasoning-beta": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.20-reasoning-beta",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 2000000,
    "maxOutputTokens": 2000000
  },
  "vercel-ai-gateway/spacexai/grok-4.3": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/spacexai/grok-4.5": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "vercel-ai-gateway/spacexai/grok-4.6": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "vercel-ai-gateway/spacexai/grok-4.7": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "vercel-ai-gateway/spacexai/grok-build-0.1": {
    "provider": "vercel-ai-gateway",
    "id": "spacexai/grok-build-0.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/stepfun/step-3.5-flash": {
    "provider": "vercel-ai-gateway",
    "id": "stepfun/step-3.5-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262114,
    "maxOutputTokens": 262114
  },
  "vercel-ai-gateway/stepfun/step-3.7-flash": {
    "provider": "vercel-ai-gateway",
    "id": "stepfun/step-3.7-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/tencent/hy3": {
    "provider": "vercel-ai-gateway",
    "id": "tencent/hy3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 262144,
    "maxOutputTokens": 262144
  },
  "vercel-ai-gateway/tencent/hy4-preview": {
    "provider": "vercel-ai-gateway",
    "id": "tencent/hy4-preview",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1024000,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/thinkingmachines/inkling": {
    "provider": "vercel-ai-gateway",
    "id": "thinkingmachines/inkling",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 256000,
    "maxOutputTokens": 256000
  },
  "vercel-ai-gateway/thinkingmachines/inkling-small": {
    "provider": "vercel-ai-gateway",
    "id": "thinkingmachines/inkling-small",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/xiaomi/mimo-v2.5": {
    "provider": "vercel-ai-gateway",
    "id": "xiaomi/mimo-v2.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 131100
  },
  "vercel-ai-gateway/xiaomi/mimo-v2.5-pro": {
    "provider": "vercel-ai-gateway",
    "id": "xiaomi/mimo-v2.5-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1050000,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/xiaomi/mimo-v2.6-flash": {
    "provider": "vercel-ai-gateway",
    "id": "xiaomi/mimo-v2.6-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/xiaomi/mimo-v2.6-pro": {
    "provider": "vercel-ai-gateway",
    "id": "xiaomi/mimo-v2.6-pro",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/xiaomi/mimo-v2.6-pro-ultraspeed": {
    "provider": "vercel-ai-gateway",
    "id": "xiaomi/mimo-v2.6-pro-ultraspeed",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/zai/glm-4.5": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 96000
  },
  "vercel-ai-gateway/zai/glm-4.5-air": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.5-air",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 128000,
    "maxOutputTokens": 96000
  },
  "vercel-ai-gateway/zai/glm-4.5v": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.5v",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 66000,
    "maxOutputTokens": 16000
  },
  "vercel-ai-gateway/zai/glm-4.6": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.6",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 96000
  },
  "vercel-ai-gateway/zai/glm-4.7": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.7",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 120000
  },
  "vercel-ai-gateway/zai/glm-4.7-flash": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.7-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/zai/glm-4.7-flashx": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-4.7-flashx",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/zai/glm-5": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 202800,
    "maxOutputTokens": 131100
  },
  "vercel-ai-gateway/zai/glm-5-turbo": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5-turbo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 202800,
    "maxOutputTokens": 131100
  },
  "vercel-ai-gateway/zai/glm-5.1": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.1",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 202800,
    "maxOutputTokens": 64000
  },
  "vercel-ai-gateway/zai/glm-5.2": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.2",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/zai/glm-5.2-fast": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.2-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 128000
  },
  "vercel-ai-gateway/zai/glm-5.3": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.3",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 1000000
  },
  "vercel-ai-gateway/zai/glm-5.3-fast": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.3-fast",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1048576,
    "maxOutputTokens": 262144
  },
  "vercel-ai-gateway/zai/glm-5.3-flash": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.3-flash",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131000
  },
  "vercel-ai-gateway/zai/glm-5.3-flashx": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5.3-flashx",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "vercel-ai-gateway/zai/glm-5v-turbo": {
    "provider": "vercel-ai-gateway",
    "id": "zai/glm-5v-turbo",
    "protocol": "anthropic-messages",
    "endpoint": "https://ai-gateway.vercel.sh",
    "contextWindow": 200000,
    "maxOutputTokens": 128000
  },
  "xai/grok-4.3": {
    "provider": "xai",
    "id": "grok-4.3",
    "protocol": "openai-completions",
    "endpoint": "https://api.x.ai/v1",
    "contextWindow": 1000000,
    "maxOutputTokens": 30000
  },
  "xai/grok-4.5": {
    "provider": "xai",
    "id": "grok-4.5",
    "protocol": "openai-completions",
    "endpoint": "https://api.x.ai/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "xai/grok-4.6": {
    "provider": "xai",
    "id": "grok-4.6",
    "protocol": "openai-completions",
    "endpoint": "https://api.x.ai/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "xai/grok-4.7": {
    "provider": "xai",
    "id": "grok-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://api.x.ai/v1",
    "contextWindow": 500000,
    "maxOutputTokens": 500000
  },
  "xiaomi/mimo-v2.5": {
    "provider": "xiaomi",
    "id": "mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi/mimo-v2.5-pro": {
    "provider": "xiaomi",
    "id": "mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi/mimo-v2.5-pro-ultraspeed": {
    "provider": "xiaomi",
    "id": "mimo-v2.5-pro-ultraspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi/mimo-v2.6-flash": {
    "provider": "xiaomi",
    "id": "mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi/mimo-v2.6-pro": {
    "provider": "xiaomi",
    "id": "mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi/mimo-v2.6-pro-ultraspeed": {
    "provider": "xiaomi",
    "id": "mimo-v2.6-pro-ultraspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-ams/mimo-v2.5": {
    "provider": "xiaomi-token-plan-ams",
    "id": "mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-ams.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-ams/mimo-v2.5-pro": {
    "provider": "xiaomi-token-plan-ams",
    "id": "mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-ams.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-ams/mimo-v2.6-flash": {
    "provider": "xiaomi-token-plan-ams",
    "id": "mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-ams.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-ams/mimo-v2.6-pro": {
    "provider": "xiaomi-token-plan-ams",
    "id": "mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-ams.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-cn/mimo-v2.5": {
    "provider": "xiaomi-token-plan-cn",
    "id": "mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-cn.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-cn/mimo-v2.5-pro": {
    "provider": "xiaomi-token-plan-cn",
    "id": "mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-cn.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-cn/mimo-v2.6-flash": {
    "provider": "xiaomi-token-plan-cn",
    "id": "mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-cn.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-cn/mimo-v2.6-pro": {
    "provider": "xiaomi-token-plan-cn",
    "id": "mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-cn.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-sgp/mimo-v2.5": {
    "provider": "xiaomi-token-plan-sgp",
    "id": "mimo-v2.5",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-sgp.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-sgp/mimo-v2.5-pro": {
    "provider": "xiaomi-token-plan-sgp",
    "id": "mimo-v2.5-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-sgp.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-sgp/mimo-v2.6-flash": {
    "provider": "xiaomi-token-plan-sgp",
    "id": "mimo-v2.6-flash",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-sgp.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "xiaomi-token-plan-sgp/mimo-v2.6-pro": {
    "provider": "xiaomi-token-plan-sgp",
    "id": "mimo-v2.6-pro",
    "protocol": "openai-completions",
    "endpoint": "https://token-plan-sgp.xiaomimimo.com/v1",
    "contextWindow": 1048576,
    "maxOutputTokens": 131072
  },
  "zai/glm-4.7": {
    "provider": "zai",
    "id": "glm-4.7",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 204800,
    "maxOutputTokens": 131072
  },
  "zai/glm-5-turbo": {
    "provider": "zai",
    "id": "glm-5-turbo",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 200000,
    "maxOutputTokens": 131072
  },
  "zai/glm-5.2": {
    "provider": "zai",
    "id": "glm-5.2",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai/glm-5.2-highspeed": {
    "provider": "zai",
    "id": "glm-5.2-highspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai/glm-5.3": {
    "provider": "zai",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai/glm-5.3-flash": {
    "provider": "zai",
    "id": "glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai/glm-5.3-highspeed": {
    "provider": "zai",
    "id": "glm-5.3-highspeed",
    "protocol": "openai-completions",
    "endpoint": "https://api.z.ai/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai-coding-cn/glm-4.6v": {
    "provider": "zai-coding-cn",
    "id": "glm-4.6v",
    "protocol": "openai-completions",
    "endpoint": "https://open.bigmodel.cn/api/coding/paas/v4",
    "contextWindow": 128000,
    "maxOutputTokens": 32768
  },
  "zai-coding-cn/glm-5.3": {
    "provider": "zai-coding-cn",
    "id": "glm-5.3",
    "protocol": "openai-completions",
    "endpoint": "https://open.bigmodel.cn/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai-coding-cn/glm-5.3-flash": {
    "provider": "zai-coding-cn",
    "id": "glm-5.3-flash",
    "protocol": "openai-completions",
    "endpoint": "https://open.bigmodel.cn/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  },
  "zai-coding-cn/glm-5.3-highspeed": {
    "provider": "zai-coding-cn",
    "id": "glm-5.3-highspeed",
    "protocol": "openai-completions",
    "endpoint": "https://open.bigmodel.cn/api/coding/paas/v4",
    "contextWindow": 1000000,
    "maxOutputTokens": 131072
  }
};
export const unsupportedModels: Readonly<Record<string,string>> = {
  "amazon-bedrock/amazon.nova-2-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/amazon.nova-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/amazon.nova-micro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/amazon.nova-pro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-fable-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-fable-5-1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-4-1-20250805-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-4-5-20251101-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-4-6-v1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/apac.amazon.nova-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/apac.amazon.nova-micro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/apac.amazon.nova-pro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/apac.anthropic.claude-sonnet-4-20250514-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-opus-4-6-v1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-opus-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/au.anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/ca.amazon.nova-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/deepseek.v3-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/deepseek.v3.2": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.amazon.nova-2-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.amazon.nova-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.amazon.nova-micro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.amazon.nova-pro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-fable-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-4-5-20251101-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-4-6-v1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-sonnet-4-20250514-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/eu.mistral.pixtral-large-2502-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.amazon.nova-2-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-fable-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-fable-5-1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-4-5-20251101-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-4-6-v1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-sonnet-4-20250514-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.openai.gpt-5.6-luna": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.openai.gpt-5.6-sol": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.openai.gpt-5.6-terra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.openai.gpt-6-astra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/global.xai.grok-4.6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/google.gemma-4-26b-a4b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/google.gemma-4-31b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/google.gemma-4-e2b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/in.openai.gpt-5.6-luna": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/in.openai.gpt-5.6-terra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.amazon.nova-2-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-opus-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/jp.anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/meta.llama3-1-70b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/meta.llama3-1-8b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/meta.llama3-3-70b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/meta.llama4-maverick-17b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/meta.llama4-scout-17b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/minimax.minimax-m2": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/minimax.minimax-m2.1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/minimax.minimax-m2.5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.devstral-2-123b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.magistral-small-2509": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.ministral-3-14b-instruct": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.ministral-3-3b-instruct": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.ministral-3-8b-instruct": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.mistral-large-3-675b-instruct": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.pixtral-large-2502-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.voxtral-mini-3b-2507": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/mistral.voxtral-small-24b-2507": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/moonshot.kimi-k2-thinking": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/moonshotai.kimi-k2.5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/nvidia.nemotron-nano-12b-v2": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/nvidia.nemotron-nano-3-30b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/nvidia.nemotron-nano-9b-v2": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/nvidia.nemotron-super-3-120b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-5.4": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-5.5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-5.6-luna": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-5.6-sol": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-5.6-terra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-6-astra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-120b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-120b-1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-20b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-20b-1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-safeguard-120b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/openai.gpt-oss-safeguard-20b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-235b-a22b-2507-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-32b-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-coder-30b-a3b-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-coder-480b-a35b-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-coder-next": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-next-80b-a3b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/qwen.qwen3-vl-235b-a22b": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us-gov.openai.gpt-oss-120b-1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us-gov.openai.gpt-oss-20b-1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.amazon.nova-2-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.amazon.nova-lite-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.amazon.nova-micro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.amazon.nova-premier-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.amazon.nova-pro-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-fable-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-fable-5-1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-haiku-4-5-20251001-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-4-1-20250805-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-4-5-20251101-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-4-6-v1": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-4-7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-4-8": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-opus-5-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-sonnet-4-20250514-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-sonnet-4-5-20250929-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-sonnet-4-6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.anthropic.claude-sonnet-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.meta.llama3-1-70b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.meta.llama3-1-8b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.meta.llama3-3-70b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.meta.llama4-maverick-17b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.meta.llama4-scout-17b-instruct-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.mistral.pixtral-large-2502-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.openai.gpt-5.6-luna": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.openai.gpt-5.6-sol": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.openai.gpt-5.6-terra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.openai.gpt-6-astra": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.writer.palmyra-x4-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.writer.palmyra-x5-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/us.xai.grok-4.6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/writer.palmyra-x4-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/writer.palmyra-x5-v1:0": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/xai.grok-4.3": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/xai.grok-4.6": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/zai.glm-4.7": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/zai.glm-4.7-flash": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "amazon-bedrock/zai.glm-5": "的协议 bedrock-converse-stream 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4-turbo": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4.1": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4.1-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4.1-nano": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4o": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4o-2024-05-13": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4o-2024-08-06": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4o-2024-11-20": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-4o-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5-chat-latest": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5-nano": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.1": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.2": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.2-chat-latest": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.2-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.3-chat-latest": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.3-codex": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.3-codex-spark": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.4": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.4-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.4-nano": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.4-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.5": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.5-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.6-luna": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.6-sol": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-5.6-terra": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-6-astra": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-6-luna": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-6-sol": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/gpt-realtime-2.1": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o1": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o1-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o3": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o3-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o3-pro": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "azure-openai-responses/o4-mini": "的协议 azure-openai-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/deep-research-max-preview-04-2026": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/deep-research-preview-04-2026": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-2.5-computer-use-preview-10-2025": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-2.5-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-2.5-flash-lite": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-2.5-pro": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3-flash-preview": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-flash-lite": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-flash-lite-image": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-flash-lite-preview": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-flash-live-preview": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-pro-preview": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.1-pro-preview-customtools": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.5-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.5-flash-lite": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.6-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.7-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-3.8-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-flash-latest": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemini-flash-lite-latest": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemma-4-26b-a4b-it": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google/gemma-4-31b-it": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-2.5-flash": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-2.5-flash-lite": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-2.5-pro": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3-flash-preview": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.1-flash-lite": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.1-pro-preview": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.1-pro-preview-customtools": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.5-flash": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.5-flash-lite": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.6-flash": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.7-flash": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-3.8-flash": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-flash-latest": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "google-vertex/gemini-flash-lite-latest": "的协议 google-vertex 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/codestral-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-2512": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-medium-2507": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-medium-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-small-2505": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/devstral-small-2507": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/labs-devstral-small-2512": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/magistral-medium-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/magistral-small": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/ministral-3b-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/ministral-8b-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-large-2411": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-large-2512": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-large-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-medium-2505": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-medium-2508": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-medium-2604": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-medium-3.5": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-medium-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-nemo": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-small-2506": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-small-2603": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/mistral-small-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/open-mistral-7b": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/open-mistral-nemo": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/open-mixtral-8x22b": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/open-mixtral-8x7b": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/pixtral-12b": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/pixtral-large-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/voxtral-small-latest": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/zai-glm-5-2": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "mistral/zai-glm-5-3": "的协议 mistral-conversations 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-5.3-codex-spark": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-5.5": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-5.6-luna": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-5.6-sol": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-5.6-terra": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-6-astra": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-6-luna": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "openai-codex/gpt-6-sol": "的协议 openai-codex-responses 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.1-pro": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.5-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.5-flash-lite": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.6-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.7-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "opencode/gemini-3.8-flash": "的协议 google-generative-ai 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/balanced": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/cheap": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-fable-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-fable-5-1": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-haiku-4-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-opus-4-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-opus-4-8": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-opus-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-opus-5-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-sonnet-4-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/claude-sonnet-5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/deepseek-v4-flash": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/deepseek-v4-pro": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/deepseek-v4.1-flash": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/glm-5.2": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/glm-5.3": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/glm-5.3-flash": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.3-codex": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.4": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.4-mini": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.5": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.6-luna": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.6-sol": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-5.6-terra": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-6-astra": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-6-luna": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/gpt-6-sol": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/kimi-k2.7-code": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/kimi-k3": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）",
  "radius/precise": "的协议 pi-messages 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）"
};
