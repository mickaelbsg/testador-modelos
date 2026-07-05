# Testador de Modelos

Interface web para testar modelos LLM, medir latencia, registrar erros e recomendar o melhor modelo disponivel no momento.

## Stack

- Backend: Node.js + Express
- Frontend: React + Vite
- Persistencia: JSON local
- Provider inicial: NVIDIA Integrate API (`/v1/chat/completions`)

## Funcionalidades

- Cadastrar, editar e remover modelos NVIDIA
- Editar e salvar prompt de teste
- Rodar teste contra todos os modelos habilitados
- Medir latencia por modelo
- Capturar status HTTP e erro
- Calcular score por disponibilidade + latencia + tamanho de resposta
- Recomendar melhor modelo disponivel
- Salvar ultimo resultado no backend (JSON local)
- Exibir ranking em tabela
- Mostrar resposta de cada modelo em `details/accordion`

## Configuracao

Nunca coloque chave no frontend.

1. Copie o arquivo de ambiente do backend:

```bash
cd backend
cp .env.example .env
```

2. Edite o `.env` e informe `NVIDIA_API_KEY`.

## Rodar localmente (1 comando)

Na raiz do projeto, rode:

```bash
npm install
npm run dev
```

Isso instala as dependencias dos dois apps (workspaces) e sobe backend + frontend juntos.

Depois que subir:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Rodar manualmente (opcional)

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Endpoints principais

- `GET /api/models`
- `POST /api/models`
- `PUT /api/models/:id`
- `DELETE /api/models/:id`
- `GET /api/prompt`
- `PUT /api/prompt`
- `POST /api/test/run`
- `GET /api/test/last`

## Onde os dados sao salvos

Toda a persistencia local fica em:

- `backend/data/store.json`

Campos principais do arquivo:

- `models`: lista de modelos cadastrados
- `prompt`: prompt atual salvo
- `lastRun`: ultimo teste executado (ranking, latencia, status, erros e respostas)

## Comportamento ao excluir modelo

Quando voce remove um modelo pela interface, ele e removido de `models` no arquivo `backend/data/store.json`.

Observacao:

- O `lastRun` antigo pode continuar mostrando esse modelo, pois representa um historico da ultima execucao.
- Na proxima execucao, o teste roda apenas com modelos ainda presentes em `models` e com `enabled: true`.

## Troubleshooting

### "Nao aparece log" ou app nao sobe

Geralmente e porta ocupada (`EADDRINUSE`).

1. Verifique portas em uso:

```bash
ss -ltnp | grep -E '(:3001|:5173|:5174)'
```

2. Mate processos antigos Node (ajuste os PIDs conforme saida):

```bash
kill <pid1> <pid2> <pid3>
```

3. Suba novamente:

```bash
npm run dev
```
