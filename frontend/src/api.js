const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Erro ao consumir API.");
  }

  return data;
}

export function fetchModels() {
  return request("/api/models");
}

export function createModel(payload) {
  return request("/api/models", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateModel(modelId, payload) {
  return request(`/api/models/${modelId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteModel(modelId) {
  return request(`/api/models/${modelId}`, {
    method: "DELETE"
  });
}

export function fetchPrompt() {
  return request("/api/prompt");
}

export function updatePrompt(prompt) {
  return request("/api/prompt", {
    method: "PUT",
    body: JSON.stringify({ prompt })
  });
}

export function runTests(prompt) {
  return request("/api/test/run", {
    method: "POST",
    body: JSON.stringify({ prompt })
  });
}

export function fetchLastRun() {
  return request("/api/test/last");
}
