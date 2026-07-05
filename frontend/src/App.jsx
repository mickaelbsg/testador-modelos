import { useEffect, useMemo, useState } from "react";
import {
  createModel,
  deleteModel,
  fetchLastRun,
  fetchModels,
  fetchPrompt,
  runTests,
  updateModel,
  updatePrompt
} from "./api";

function formatLatency(value) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${value} ms`;
}

function formatScore(value) {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(1);
}

export default function App() {
  const [models, setModels] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [lastRun, setLastRun] = useState(null);
  const [newModelName, setNewModelName] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setGlobalError("");

      try {
        const [modelsData, promptData, runData] = await Promise.all([
          fetchModels(),
          fetchPrompt(),
          fetchLastRun()
        ]);

        setModels(modelsData.models || []);
        setPrompt(promptData.prompt || "");
        setLastRun(runData.lastRun || null);
      } catch (error) {
        setGlobalError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled).length,
    [models]
  );

  async function handleCreateModel(event) {
    event.preventDefault();
    const trimmed = newModelName.trim();

    if (!trimmed) {
      return;
    }

    setGlobalError("");

    try {
      const data = await createModel({ name: trimmed, enabled: true });
      setModels(data.models || []);
      setNewModelName("");
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  async function handleUpdateModel(modelId, payload) {
    setGlobalError("");

    try {
      const data = await updateModel(modelId, payload);
      setModels(data.models || []);
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  async function handleDeleteModel(modelId) {
    setGlobalError("");

    try {
      const data = await deleteModel(modelId);
      setModels(data.models || []);
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  async function handleSavePrompt() {
    setIsSavingPrompt(true);
    setGlobalError("");

    try {
      await updatePrompt(prompt);
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsSavingPrompt(false);
    }
  }

  async function handleRunTests() {
    setIsRunning(true);
    setGlobalError("");

    try {
      const run = await runTests(prompt);
      setLastRun(run);
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsRunning(false);
    }
  }

  if (isLoading) {
    return <main className="layout"><p>Carregando dados...</p></main>;
  }

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">NVIDIA LLM BENCH</p>
        <h1>Testador de Modelos</h1>
        <p>
          Compare modelos NVIDIA, acompanhe latencia real, status HTTP, falhas e
          score consolidado para recomendar o melhor endpoint no momento.
        </p>
      </header>

      {globalError ? <p className="error-banner">Erro: {globalError}</p> : null}

      <section className="panel">
        <div className="panel-title-row">
          <h2>Modelos NVIDIA</h2>
          <span>{enabledModels} habilitado(s)</span>
        </div>

        <form className="add-model-form" onSubmit={handleCreateModel}>
          <input
            type="text"
            value={newModelName}
            onChange={(event) => setNewModelName(event.target.value)}
            placeholder="Ex: meta/llama-3.1-70b-instruct"
          />
          <button type="submit">Adicionar</button>
        </form>

        <div className="model-list">
          {models.map((model) => (
            <article className="model-item" key={model.id}>
              <input
                className="model-input"
                type="text"
                value={model.name}
                onChange={(event) =>
                  handleUpdateModel(model.id, { name: event.target.value })
                }
              />
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(model.enabled)}
                  onChange={(event) =>
                    handleUpdateModel(model.id, { enabled: event.target.checked })
                  }
                />
                ativo
              </label>
              <button type="button" onClick={() => handleDeleteModel(model.id)}>
                remover
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h2>Prompt de Teste</h2>
          <div className="action-row">
            <button type="button" onClick={handleSavePrompt} disabled={isSavingPrompt}>
              {isSavingPrompt ? "Salvando..." : "Salvar prompt"}
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleRunTests}
              disabled={isRunning || !enabledModels}
            >
              {isRunning ? "Executando..." : "Rodar em todos os modelos"}
            </button>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={6}
        />
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h2>Ultimo Resultado</h2>
          <span>{lastRun?.ranAt ? new Date(lastRun.ranAt).toLocaleString() : "sem execucao"}</span>
        </div>

        {!lastRun ? (
          <p>Nenhum teste executado ainda.</p>
        ) : (
          <>
            <div className="recommendation">
              <strong>Modelo recomendado:</strong>{" "}
              {lastRun.recommendedModel
                ? `${lastRun.recommendedModel.modelName} (score ${formatScore(lastRun.recommendedModel.score)})`
                : "Nenhum modelo disponivel"}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Modelo</th>
                    <th>Status HTTP</th>
                    <th>Latencia</th>
                    <th>Score</th>
                    <th>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {lastRun.ranking.map((item, index) => (
                    <tr key={`${item.modelId}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item.modelName}</td>
                      <td>{item.status}</td>
                      <td>{formatLatency(item.latencyMs)}</td>
                      <td>{formatScore(item.score)}</td>
                      <td>{item.error || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="details-wrap">
              {lastRun.results.map((item) => (
                <details key={item.modelId}>
                  <summary>
                    {item.modelName} | status {item.status} | {formatLatency(item.latencyMs)} | score {formatScore(item.score)}
                  </summary>
                  <pre>{item.responseText || item.error || "Sem resposta."}</pre>
                </details>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
