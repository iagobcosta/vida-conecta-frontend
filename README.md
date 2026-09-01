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

| Variável | Dev | Produção (Vercel) |
| --- | --- | --- |
| `VITE_API_URL` | vazio (usa o proxy) | origem da API, **sem barra no final**, ex. `https://api.exemplo.com` |

`VITE_*` entra no bundle no **build**. Depois de mudar a variável na Vercel, faça um novo deploy.

## Publicar na Vercel

O app é um SPA (React Router). O `vercel.json` faz o fallback das rotas para `index.html` e fixa o Node 22.

1. No [dashboard da Vercel](https://vercel.com/new), importe o repositório do frontend (`vida-conecta-frontend`). Se o Git for o monorepo, defina **Root Directory** como `vida-conecta-frontend`.
2. Framework: **Vite** (já está no `vercel.json`). Build: `npm run build`. Output: `dist`.
3. Em **Environment Variables**, crie `VITE_API_URL` com a URL pública do backend (ex. `https://api.vidaconecta.com.br`) nos ambientes Production, Preview e Development que forem usar a API.
4. No backend, libere o front no CORS e nos convites por e-mail:

```bash
CORS_ALLOWED_ORIGINS=https://seu-projeto.vercel.app,https://*.vercel.app,http://localhost:5173
FRONTEND_BASE_URL=https://seu-projeto.vercel.app
```

`https://*.vercel.app` cobre deploys de preview. O domínio de produção (incluindo domínio próprio) precisa estar na lista.

5. Faça o deploy. Rotas como `/login` e `/cadastro/medico` devem abrir no refresh, não só pelo clique interno.

Para validar o bundle localmente antes de publicar:

```bash
npm run build
npm run preview
```

## Papéis e rotas

- Públicas: `/login`, `/cadastro` (somente paciente), `/cadastro/admin`, `/cadastro/medico` (convite)
- Paciente: `/inicio`, `/notificacoes`, `/agenda`, `/agenda/nova` (busca o médico e escolhe um horário livre da agenda), `/consentimentos`, `/prontuario`, `/receitas`, `/consulta/:appointmentId`
- Médico: `/inicio`, `/notificacoes`, `/agenda` (confirmar/cancelar/concluir), `/horarios` (períodos semanais de atendimento), `/prontuario`, `/receitas`, `/consulta/:appointmentId` (evolução e receita)
- Admin: `/inicio` (painel com insights, gráficos e ativar/desativar médicos), `/medicos` (convite por e-mail), `/notificacoes`

O cadastro público é só de paciente. O admin convida o médico pelo nome e e-mail; o médico termina o cadastro no link do convite.

Na tela de nova consulta o paciente busca por nome, especialidade ou CRM, seleciona o médico e vê os encaixes livres dos próximos 14 dias. Sem horários cadastrados pelo médico, a agenda aparece vazia.

O médico precisa informar um motivo ao cancelar. O paciente recebe a notificação com o texto e pode reagendar a partir dela ou da agenda.

## Sala de consulta

`POST /api/v1/video/appointments/{id}/token` devolve token **mock**. A tela mostra sala/status e pode abrir preview local (`getUserMedia`). A API só libera o token se a consulta estiver confirmada e dentro da janela (10 minutos antes até o fim do horário).

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # checagem TypeScript + bundle
npm run preview  # servir o build
npm run lint     # oxlint
```

Node 22 (`engines` e `.nvmrc`). A Vercel usa essa versão no build.
