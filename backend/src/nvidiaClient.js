const DEFAULT_TIMEOUT_MS = 45000;

function parseResponseText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (typeof item?.text === "string") {
          return item.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function parseError(payload) {
  if (!payload) {
    return "Falha sem payload de erro.";
  }

  if (typeof payload.error?.message === "string") {
    return payload.error.message;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item?.msg || String(item)).join("; ");
  }

  return "Falha nao mapeada pelo provider.";
}

export async function runModelTest({ apiUrl, apiKey, modelName, prompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 512
      }),
      signal: controller.signal
    });

    const latencyMs = Date.now() - startedAt;
    const payload = await response.json().catch(() => null);
    const responseText = parseResponseText(payload);

    if (!response.ok) {
      return {
        status: response.status,
        latencyMs,
        responseText,
        error: parseError(payload),
        available: false
      };
    }

    return {
      status: response.status,
      latencyMs,
      responseText,
      error: null,
      available: true
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error?.name === "AbortError") {
      return {
        status: 504,
        latencyMs,
        responseText: "",
        error: "Timeout ao aguardar resposta do provider.",
        available: false
      };
    }

    return {
      status: 500,
      latencyMs,
      responseText: "",
      error: error?.message || "Erro desconhecido durante a chamada.",
      available: false
    };
  } finally {
    clearTimeout(timeout);
  }
}
