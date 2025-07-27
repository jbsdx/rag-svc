# Retrieval Augmented Generation - RPC Server

Basic setup for a retrieval augmented generation service

Contains:

- RPC Server (Typescript)
- LiteLLM Proxy
- Postgres database
- Qdrant vector database

RPC server methods:

- Embed data into the vector database
- Generate LLM text completions with context (RAG)
- Find similar text chunks via vector similarity search
- List vector database collections
- Delete specific points from vector database collections

## Setup

Run docker services with ollama LLM

```sh
npm run docker-with-llm
```

Download LLM (e.g. llama3.1)

```sh
docker exec -it ollama "ollama run llama3.1:8b"
```

Run RPC server for local development

```sh
npm start
```

## Configuration

### Settings for local development

Add variables in .env file

```text/plain
NODE_ENV=dev
RPC_API_KEY=[change-it]
LITELLM_API_KEY=[change-it]

POSTGRES_DB=litellm
POSTGRES_USER=llmproxy
POSTGRES_PASSWORD=[change-it]

# LiteLLM settings
UI_USERNAME=admin
UI_PASSWORD=[change-it]
LITELLM_API_KEY=[change-it]
DATABASE_URL="postgresql://llmproxy:[change-it]@localhost:5432/litellm"
STORE_MODEL_IN_DB="True"
```

### Settings docker services

Add variables in .env.docker file

```text/plain
NODE_ENV=dev

# RPC server credentials
LLM_PROXY_URL="http://litellm:4000"
VECTOR_DB_URL="http://qdrant:6333"
TRPC_PANEL_URL="http://localhost:3001"
RPC_API_KEY=[change-it]

# Postgres credentials
POSTGRES_DB=litellm
POSTGRES_USER=llmproxy
POSTGRES_PASSWORD=[change-it]

# LiteLLM settings
UI_USERNAME=admin
UI_PASSWORD=[change-it]
LITELLM_API_KEY=[change-it]
DATABASE_URL="postgresql://llmproxy:[change-it]@db:5432/litellm"
STORE_MODEL_IN_DB="True"
```

## Ollama

Container uses nvidia gpu as default setting for LLM generations.

Remove the `deploy:` setting from the `docker-compose.llm.yml` for cpu usage.

## Links

[LiteLLM proxy OpenAPI](http://localhost:4000)

[LiteLLM proxy Dashboard](http://localhost:4000/ui)

[Qdrant dashboard](http://localhost:6333/dashboard)

[OpenAPI UI](http://localhost:3001/api/swagger)
