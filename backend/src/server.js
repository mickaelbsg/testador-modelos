import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { loadStore, updateStore } from "./store.js";
import { runModelTest } from "./nvidiaClient.js";
import { calculateScore } from "./scoring.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiUrl = process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1/chat/completions";
const apiKey = process.env.NVIDIA_API_KEY || "";

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/models", async (_req, res) => {
  const store = await loadStore();
  res.json({ models: store.models });
});

app.post("/api/models", async (req, res) => {
  const { name, enabled = true } = req.body ?? {};

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Campo 'name' e obrigatorio." });
  }

  const newModel = {
    id: crypto.randomUUID(),
    name: name.trim(),
    enabled: Boolean(enabled)
  };

  const updated = await updateStore((store) => ({
    ...store,
    models: [...store.models, newModel]
  }));

  return res.status(201).json({ models: updated.models });
});

app.put("/api/models/:id", async (req, res) => {
  const modelId = req.params.id;
  const { name, enabled } = req.body ?? {};

  const updated = await updateStore((store) => {
    const models = store.models.map((model) => {
      if (model.id !== modelId) {
        return model;
      }

      return {
        ...model,
        name: typeof name === "string" && name.trim() ? name.trim() : model.name,
        enabled: typeof enabled === "boolean" ? enabled : model.enabled
      };
    });

    return {
      ...store,
      models
    };
  });

  res.json({ models: updated.models });
});

app.delete("/api/models/:id", async (req, res) => {
  const modelId = req.params.id;

  const updated = await updateStore((store) => ({
    ...store,
    models: store.models.filter((model) => model.id !== modelId)
  }));

  res.json({ models: updated.models });
});

app.get("/api/prompt", async (_req, res) => {
  const store = await loadStore();
  res.json({ prompt: store.prompt || "" });
});

app.put("/api/prompt", async (req, res) => {
  const { prompt } = req.body ?? {};

  if (typeof prompt !== "string") {
    return res.status(400).json({ error: "Campo 'prompt' deve ser string." });
  }

  const updated = await updateStore((store) => ({
    ...store,
    prompt
  }));

  return res.json({ prompt: updated.prompt });
});

app.get("/api/test/last", async (_req, res) => {
  const store = await loadStore();
  res.json({ lastRun: store.lastRun });
});

app.post("/api/test/run", async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({
      error: "NVIDIA_API_KEY nao configurada no backend (.env)."
    });
  }

  const store = await loadStore();
  const promptFromBody = req.body?.prompt;
  const promptToUse = typeof promptFromBody === "string" ? promptFromBody : store.prompt;

  const enabledModels = store.models.filter((model) => model.enabled);

  if (!enabledModels.length) {
    return res.status(400).json({ error: "Nenhum modelo habilitado para teste." });
  }

  const testedModels = await Promise.all(
    enabledModels.map(async (model) => {
      const result = await runModelTest({
        apiUrl,
        apiKey,
        modelName: model.name,
        prompt: promptToUse
      });

      const score = calculateScore({
        available: result.available,
        latencyMs: result.latencyMs,
        responseText: result.responseText
      });

      return {
        modelId: model.id,
        modelName: model.name,
        status: result.status,
        latencyMs: result.latencyMs,
        error: result.error,
        responseText: result.responseText,
        available: result.available,
        score
      };
    })
  );

  const ranking = [...testedModels].sort((a, b) => b.score - a.score);
  const recommendedModel = ranking.find((item) => item.available) || null;

  const run = {
    runId: crypto.randomUUID(),
    ranAt: new Date().toISOString(),
    promptUsed: promptToUse,
    provider: apiUrl,
    results: testedModels,
    ranking,
    recommendedModel,
    summary: {
      total: testedModels.length,
      success: testedModels.filter((item) => item.available).length,
      failed: testedModels.filter((item) => !item.available).length
    }
  };

  await updateStore((current) => ({
    ...current,
    prompt: promptToUse,
    lastRun: run
  }));

  res.json(run);
});

app.listen(port, () => {
  console.log(`Testador backend em http://localhost:${port}`);
});
