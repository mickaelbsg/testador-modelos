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
