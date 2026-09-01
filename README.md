# Vida Conecta — Frontend

Interface web do MVP de telemedicina: autenticação JWT, agenda, consentimento (LGPD), prontuário, prescrição digital e sala de consulta com token mock (sem LiveKit/SFU nesta entrega).

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS 4
- React Router, TanStack Query, Zustand
- React Hook Form + Zod
- Cliente HTTP com `fetch` (`Authorization: Bearer`)

O JWT fica só no `localStorage`. Dados clínicos **não** são persistidos no navegador.

## Pré-requisitos

- Node.js 22+
- API do backend em `http://localhost:8080` (veja `vida-conecta-backend/README.md`)

## Subir com o backend

1. Suba o PostgreSQL e a API:

```bash
cd ../vida-conecta-backend
docker compose up -d
./mvnw spring-boot:run
```

2. Instale e rode o frontend:

```bash
npm install
npm run dev
```

O Vite escuta em [http://localhost:5173](http://localhost:5173) e faz proxy de `/api` para `http://localhost:8080`, evitando CORS em desenvolvimento. CORS do backend também libera essa origem.

Copie `.env.example` para `.env` se quiser apontar para outra API:

| Variável | Dev | Produção |
| --- | --- | --- |
| `VITE_API_URL` | vazio (usa o proxy) | origem da API, ex. `https://api.exemplo.com` |

## Papéis e rotas

- Públicas: `/login`, `/cadastro` (paciente: CPF e nascimento; médico: CRM e especialidade)
- Paciente: `/agenda`, `/agenda/nova`, `/consentimentos`, `/prontuario`, `/receitas`, `/consulta/:appointmentId`
- Médico: `/agenda` (confirmar/cancelar), `/prontuario`, `/receitas`, `/consulta/:appointmentId` (evolução e receita)
- Admin não se cadastra nesta UI

## Sala de consulta

`POST /api/v1/video/appointments/{id}/token` devolve token **mock**. A tela mostra sala/status e pode abrir preview local (`getUserMedia`). A API só libera o token se a consulta estiver confirmada e dentro da janela (10 minutos antes até o fim do horário).

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # checagem TypeScript + bundle
npm run preview  # servir o build
npm run lint     # oxlint
```
