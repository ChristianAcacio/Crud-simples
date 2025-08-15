# Guia Extenso do Projeto: Next.js + NestJS (CRUD de Tarefas) – Explicação Técnica e Prática

Este guia foi escrito para quem está começando do zero e quer entender, com profundidade, cada peça deste projeto full‑stack. Ele também destaca pontos que caem em entrevistas. Use-o como material de estudo e referência.


## Visão geral do projeto

- Frontend: Next.js 15 (React 19) com TypeScript e Tailwind CSS (v4), usando o diretório `app/` (App Router) e componentes Server/Client.
- Backend: NestJS 11 com TypeORM e SQLite para persistência, expondo uma API REST simples de tarefas.
- Infra: Dockerfiles para frontend e backend, e um `docker-compose.yml` que orquestra os serviços (inclui um Postgres opcional, não usado pelo backend atual).

Fluxo típico:
1) A página carrega em `http://localhost:3000`.
2) O componente de tarefas busca dados no backend `http://localhost:3003` (ou URL configurada).
3) O backend executa operações CRUD no banco SQLite `backend/database.sqlite` via TypeORM.
4) A página também mostra uma lista de usuários do GitHub, consumindo a API pública do GitHub do lado do servidor (Server Component), com revalidação de cache.


## Estrutura de pastas relevante

Raiz (`c:/Users/Christian/desafio`):
- `package.json`: scripts e dependências do frontend.
- `next.config.ts`: configuração do Next (rewrites/proxy para a API).
- `src/app/`: código da aplicação Next (App Router).
  - `page.tsx`: página inicial, compõe os componentes.
  - `components/TaskListWrapper.tsx`: Server Component que busca as tarefas inicialmente.
  - `components/TaskList.tsx`: Client Component com estado e interações (CRUD).
  - `components/GitHubUsers.tsx`: Server Component que consome a API do GitHub.
- `public/`: assets estáticos.
- `Dockerfile` (frontend) e `docker-compose.yml` (orquestração).

Backend (`backend/`):
- `src/main.ts`: bootstrap do NestJS, CORS e porta/host.
- `src/app.module.ts`: módulo raiz, configura TypeORM + repositório `Task`.
- `src/entities/task.entity.ts`: entidade TypeORM para tarefas.
- `src/task.controller.ts`: rotas HTTP (`/tasks`).
- `src/task.service.ts`: regra de negócio e persistência.
- `package.json`: scripts do Nest e dependências.
- `Dockerfile` (backend) e `database.sqlite` (banco local).


## Frontend em detalhe (Next.js)

Arquivos-chave:

1) `package.json` (raiz)
- Scripts:
  - `dev`: `next dev --turbopack` (modo desenvolvimento com Turbopack – mais rápido, ainda evoluindo).
  - `build`: `next build` (gera build de produção).
  - `start`: `next start` (inicia servidor de produção após build).
  - `lint`: `next lint` (ESLint configurado pelo Next).
- Dependências principais: `next@15`, `react@19`, `react-dom@19`.

Pergunta de entrevista comum: O que é Turbopack? É um bundler de próxima geração (sob o ecossistema do Vercel) focado em velocidade no dev. Em alguns casos pode apresentar comportamentos diferentes do Webpack dev. Se tiver problemas, você pode testar `next dev` sem `--turbopack`.

2) `next.config.ts`
- Define `rewrites` para mapear requisições locais `/api/:path*` para `http://localhost:3003/:path*`. Isso permite chamar o backend via `/api` no frontend, evitando CORS/URLs absolutas. Nota: o código atual usa URL absoluta (`NEXT_PUBLIC_API_URL`) em `TaskList` e `TaskListWrapper`. O rewrite é útil caso você troque as chamadas para `/api/tasks` no futuro.

3) `src/app/page.tsx`
- É a página inicial (App Router). Renderiza um header, `TaskListWrapper` (tarefas) e `GitHubUsers` (lista do GitHub).
- App Router: cada arquivo de componente sob `app/` pode ser Server Component por padrão (sem `"use client"`).

4) `src/app/components/TaskListWrapper.tsx` (Server Component)
- Objetivo: buscar as tarefas do backend no servidor (Node do Next) e repassar como `initialTasks` para o componente cliente.
- Código-base:
  - Lê `API_URL` de `process.env.NEXT_PUBLIC_API_URL` (se vazio, usa `http://localhost:3003`).
  - Faz `fetch(`${API_URL}/tasks`, { cache: 'no-store' })` para sempre buscar dados frescos.
  - Em caso de erro, retorna `initialTasks: []`.
- Server vs Client: por ser Server Component, o fetch acontece no servidor do Next, não no navegador do usuário. Isso reduz latência para o usuário final, evita expor tokens/segredos (quando aplicável) e otimiza SEO (quando renderiza dados críticos).
- Entrevista: Qual a diferença entre Server e Client Components?
  - Server Components: renderizam no servidor, não incluem o código JS no bundle do cliente (menor payload), podem acessar recursos server-only (DB, FS, segredos). Não têm state/efeitos do React no cliente.
  - Client Components: usam `"use client"`, rodam no browser, têm estado (`useState`, `useEffect`), interações diretas com o DOM. Não podem acessar recursos server-only diretamente.

5) `src/app/components/TaskList.tsx` (Client Component)
- Objetivo: UI interativa de tarefas (CRUD). Depende de `initialTasks` recebido do Wrapper.
- Estado e lógica:
  - `useState` para lista de tarefas, input de nova tarefa, filtro e flags (loading, error).
  - `useMemo` para computar contagens e filtrar a lista (all/active/completed) sem recomputar desnecessariamente.
  - Funções de rede: `refresh`, `addTask`, `toggleTask`, `deleteTask`, `clearCompleted`. Todas chamam o backend com `fetch` para `API_URL`.
- Padrões HTTP usados:
  - GET `/tasks` (listar), POST `/tasks` (criar), PUT `/tasks/:id` (atualizar completed), DELETE `/tasks/:id` (excluir).
- UX e acessibilidade:
  - Usa Tailwind para estilos. Botões com estados simples. Mensagens de erro e loading básicos.
- Entrevista: PUT vs PATCH? O projeto usa PUT para atualizar o campo `completed`. PUT é idempotente e, conceitualmente, substitui a representação do recurso. PATCH atualiza parcialmente. Aqui, PUT funciona porque o backend implementa “atualizar somente o campo `completed`”, mas em APIs maiores PATCH é mais comum para parciais.
- Entrevista: Onde o estado “verdadeiro” fica? No backend. O componente mantém um espelho local (state) e sincroniza com a API. Em produção, pode-se usar padrões como SWR/React Query para cache, revalidação e otimizações.

6) `src/app/components/GitHubUsers.tsx` (Server Component)
- Objetivo: carregar alguns usuários públicos do GitHub (avatar/login) e exibir.
- Implementa `fetch('https://api.github.com/users?per_page=6', { next: { revalidate: 3600 }, headers: { 'User-Agent': 'Crud-simples-app' }})`.
  - `next.revalidate: 3600` instrui o Next a revalidar a cada 1 hora (ISR/SSR caching), reduzindo chamadas e riscos de rate limit.
  - Define `User-Agent` para boas práticas com a API do GitHub.
- Se a resposta não é OK, exibe fallback amigável com o status HTTP.
- Entrevista: O que é revalidação no Next? É a capacidade de gerar/responder com conteúdo em cache e revalidar em intervalos, unindo performance e frescor dos dados (ISR – Incremental Static Regeneration).

7) Tailwind CSS 4
- Estilização utility-first. Classes como `bg-white`, `rounded`, `shadow`, `text-black` aparecem em todo o código.
- Benefícios: produtividade, consistência, facilidade de theming (ex.: dark mode futuramente).
- Entrevista: Prós/Contras de Tailwind?
  - Prós: velocidade, padronização, menos CSS global.
  - Contras: classes longas no markup, curva de aprendizagem, dependência de tooling.

8) Variáveis de ambiente no frontend
- `NEXT_PUBLIC_API_URL`: usada tanto no servidor do Next (Server Components) quanto no navegador (Client Components). O prefixo `NEXT_PUBLIC_` expõe o valor ao cliente; evite segredos aqui.
- Entrevista: Um server component pode ler env sem `NEXT_PUBLIC_`? Sim, porque roda no servidor. Porém este projeto usa a mesma env para ambos, por simplicidade.

9) `next.config.ts` – Rewrites (proxy)
- Mapeia `/api/:path*` -> `http://localhost:3003/:path*`. Vantagens:
  - Evita CORS no dev.
  - Permite trocar `API_URL` por `/api` e mudar backend sem alterar o frontend.
- Dica: Se adotar o rewrite, altere `TaskList` e `TaskListWrapper` para chamarem `/api/tasks` em vez de `process.env.NEXT_PUBLIC_API_URL`.


## Backend em detalhe (NestJS + TypeORM + SQLite)

Arquivos-chave:

1) `backend/src/main.ts`
- Cria a aplicação Nest via `NestFactory.create(AppModule)`.
- Habilita CORS para `http://localhost:3000` e `http://localhost:3001` com métodos `GET, POST, PUT, DELETE`.
- Lê `PORT` (padrão 3003) e `HOST` (padrão `0.0.0.0`), e inicia o servidor.
- Entrevista: O que é CORS? Mecanismo de segurança dos browsers que controla requisições cross-origin. O backend precisa liberar o origin do frontend no dev.

2) `backend/src/app.module.ts`
- Importa `TypeOrmModule.forRoot` com:
  - `type: 'sqlite'`
  - `database: 'database.sqlite'`
  - `entities: [Task]`
  - `synchronize: true`
- Também registra `TypeOrmModule.forFeature([Task])` para injetar `Repository<Task>`.
- Controllers: `AppController`, `TaskController`.
- Providers: `AppService`, `TaskService`.
- Entrevista: Riscos de `synchronize: true`? Em produção pode causar mudanças destrutivas/esquemas inesperados. Use migrações (TypeORM migrations) em prod.

3) `backend/src/entities/task.entity.ts`
- Entidade TypeORM `Task`:
  - `id` (PK auto‑incremento), `title` (string), `completed` (boolean default false), `createdAt` (datetime default CURRENT_TIMESTAMP).
- Entrevista: O que é uma entidade? Mapeia uma tabela do banco para uma classe TypeScript (ORM – Object-Relational Mapping).

4) `backend/src/task.service.ts`
- Serviço com regras de negócio, injeta `Repository<Task>` via `@InjectRepository(Task)`.
- Métodos:
  - `findAll()` retorna todas as tarefas.
  - `findOne(id)` busca por `id` e lança `NotFoundException` se não existir.
  - `create(title)` cria e salva.
  - `update(id, completed)` marca como concluída/não concluída.
  - `remove(id)` apaga; se não afetar nenhuma linha, lança `NotFoundException`.
- Entrevista: Vantagem do Service vs acessar o repo direto no Controller? Separa responsabilidades (Controller = transporte/HTTP, Service = negócio). Facilita testes e manutenção.

5) `backend/src/task.controller.ts`
- Controller REST em `/tasks`:
  - `GET /tasks`: lista.
  - `GET /tasks/:id`: busca uma.
  - `POST /tasks`: cria (body `{ title: string }`).
  - `PUT /tasks/:id`: atualiza completed (body `{ completed: boolean }`).
  - `DELETE /tasks/:id`: remove.
- Entrevista: Onde validar DTOs? Ideal: criar DTOs com `class-validator`/`class-transformer` e pipes de validação. O projeto está simples e usa objetos literais.

6) Banco de dados: SQLite
- Simples, baseado em arquivo, ótimo para desenvolvimento local ou apps pequenos.
- Arquivo físico: `backend/database.sqlite`.
- Entrevista: Quando trocar por Postgres? Quando precisar de concorrência, transações complexas, migrações robustas, tipos avançados, escala multi‑usuário.

7) `backend/package.json` – scripts úteis
- `start:dev`: recompila e reinicia em watch (ideal no dev).
- `start:prod`: roda `dist/main.js` após `npm run build`.
- `smoke`: executa `src/smoke.ts` (script de fumaça) para testar CRUD sem abrir porta (útil para troubleshooting).


## API: contratos e exemplos

Base URL padrão: `http://localhost:3003`

Modelo `Task` (JSON):
```
{
  id: number,
  title: string,
  completed: boolean,
  createdAt: string
}
```

Endpoints:
- GET `/tasks` → `Task[]`
- GET `/tasks/:id` → `Task` | 404
- POST `/tasks` ({ title: string }) → 201 `Task`
- PUT `/tasks/:id` ({ completed: boolean }) → 200 `Task`
- DELETE `/tasks/:id` → 200 vazio | 404

Boas práticas (entrevista):
- Use códigos HTTP corretos (200/201/204/400/404/500...).
- Diferencie PUT (idempotente) de PATCH (parcial).
- Faça validação de entrada (DTOs) e retorne mensagens claras.
- Padronize erros (ex.: problem+json) quando possível.


## Integração com GitHub (Server Component)

- Endpoint: `https://api.github.com/users?per_page=6`.
- Cache/revalidate em 3600s para reduzir chamadas.
- User-Agent próprio — boa prática e, em alguns casos, requerido.
- Entrevista: Como lidar com rate limits? Cache, backoff exponencial, autenticação com token (se necessário) e observabilidade (logs/metrics) para detectar limites atingidos.


## Docker e Docker Compose

1) `Dockerfile` (frontend)
- Base `node:18-alpine`.
- Copia `package*.json`, instala deps, copia o restante do app, roda `npm run build`, expõe 3000 e inicia com `npm start`.
- Entrevista: Por que copiar `package*.json` antes? Para aproveitar cache de camadas quando apenas o código muda, acelerando builds.

2) `backend/Dockerfile`
- Similar ao frontend, mas expõe 3003 e inicia com `npm run start:prod`.

3) `docker-compose.yml`
- Serviços:
  - `frontend`: depende de `backend`, publica 3000, define env `NEXT_PUBLIC_API_URL=http://backend:3003`.
  - `backend`: publica 3003, roda em produção.
  - `postgres`: opcional (não usado pelo backend atual, que usa SQLite). Mantido como referência; pode ser removido.
- Entrevista: Vantagens do Compose? Sobe múltiplos serviços com uma linha, define redes e dependências, facilita desenvolvimento integrado.


## Rodando localmente (resumo)

Frontend (terminal 1):
```
cd c:/Users/Christian/desafio
npm install
npm run dev
```

Backend (terminal 2):
```
cd c:/Users/Christian/desafio/backend
npm install
npm run start:dev
```

Variável opcional (se quiser URL explícita no frontend):
```
# bash (Git Bash/WSL)
export NEXT_PUBLIC_API_URL=http://localhost:3003
```

Via Docker Compose:
```
docker compose up --build
```


## Troubleshooting (erros comuns e como resolver)

1) `curl -i http://localhost:3003/tasks` falha (connection refused / exit code 7)
- Causa provável: backend não está rodando ou porta ocupada.
- Checagens:
  - Verifique se `npm run start:dev` no `backend/` está ativo e sem erros.
  - Veja logs do terminal do backend.
  - Porta 3003 em uso? Em Windows PowerShell, cheque e finalize processos travados.
  - Tente `npm run smoke` no backend para testar CRUD sem servidor HTTP.

2) CORS no frontend
- Se fizer chamadas diretas a `http://localhost:3003` no navegador e der erro de CORS, confirme que `main.ts` permite `http://localhost:3000` e `3001` em `app.enableCors`.
- Alternativa: use o rewrite `/api` do `next.config.ts` para evitar CORS.

3) Problemas com Turbopack (dev)
- Se erros estranhos ocorrerem, altere script `dev` para `next dev` sem `--turbopack` e compare comportamento.

4) `TypeORM synchronize: true` efeitos colaterais
- Em dev ajuda bastante, mas pode alterar schema automaticamente. Em produção, substitua por migrações.

5) GitHub API limitando requisições
- Atenue com `revalidate`, `User-Agent` e (se necessário) token de auth com fetch no servidor.


## Segurança e boas práticas (o que citar em entrevistas)

- Não expor segredos em `NEXT_PUBLIC_*`. Valores com credenciais devem ficar em variáveis de ambiente apenas no servidor.
- Validar entrada no backend (DTOs, pipes) para evitar dados inválidos e vulnerabilidades.
- Tratar erros consistentemente no backend e frontend (mensagens claras, logs adequados; não vazar stack trace em produção).
- CORS estrito: permitir apenas origens necessárias.
- Cabeçalhos de segurança no frontend (quando em produção via proxy/edge/frameworks): CSP, X-Content-Type-Options, etc.
- Em banco, considerar índices para colunas usadas em filtros (quando houver), e migrações em produção.
- Rate limiting e logs em endpoints de escrita.


## Performance e escalabilidade (argumentos prontos)

- Server Components reduzem JS enviado ao cliente, melhorando TTFB e LCP.
- Cache/revalidate em `GitHubUsers` evita sobrecarregar API externa e melhora latência percebida.
- Para lista de tarefas, adicionar paginação se crescer muito.
- Otimizações na UI: atualizações otimistas (optimistic updates) para `add/toggle/delete` melhoram UX.
- Backend: habilitar cache (ex.: Redis) para leituras frequentes; usar métricas (Prometheus/Grafana) e logs estruturados.


## Testes (o que estudar)

- Backend possui estrutura de testes padrão do Nest (`test/`, `jest-e2e.json`). Estude:
  - Testes unitários: Services com repositórios mockados.
  - Testes e2e: subir app Nest em memória, chamar endpoints e verificar respostas/DB.
- Frontend: adicionar testes de componentes (Jest/Testing Library) e e2e (Playwright/Cypress) como melhoria futura.


## Perguntas de entrevista e respostas curtas

Frontend/Next.js:
- Diferença entre Server e Client Components? (Explique execução, bundle, acesso a recursos, estado/efeitos.)
- O que é ISR/revalidate? (Cache com revalidação incremental.)
- Vantagens de usar fetch no Server Component? (Menos JS no cliente, melhor segurança/latência.)
- Como evitar CORS no dev? (Rewrites/proxy no Next ou configurar CORS no backend.)
- Quando usar `NEXT_PUBLIC_`? (Somente vars que podem ir para o client.)

Backend/NestJS:
- O que é um Module, Controller e Service no Nest? (Organização modular; Controller lida com transporte/HTTP; Service concentra negócio.)
- Como funciona a injeção de dependências? (Providers, decorators, container de IoC.)
- Vantagens do TypeORM? (ORM, migrações, portabilidade, produtividade.)
- Riscos de `synchronize: true`? (Mudanças de schema não controladas; evitar em produção.)
- Diferença entre `NotFoundException` e retornar `null`? (Semântica HTTP correta; 404 vs 200 com vazio.)

HTTP/REST:
- PUT vs PATCH? (Idempotência e atualização parcial.)
- Códigos de status adequados? (200, 201, 204, 400, 404, 500...)
- Idempotência: por que importa? (Requisições repetidas não devem causar efeitos inesperados.)

Banco de Dados:
- SQLite vs Postgres? (Simplicidade vs recursos/escala.)
- Quando introduzir migrações? (Ao estabilizar schema e preparar ambientes além do dev.)

DevOps/Docker:
- Por que separar Dockerfiles para frontend e backend? (Imagens menores, ciclos independentes.)
- Vantagens do Docker Compose? (Orquestração simples em dev.)


## Roadmap de estudo (novato → pleno)

1) React/Next.js App Router
- Ler docs de Server/Client Components, data fetching no server, caching e revalidate.
- Praticar reescrevendo `TaskList` para usar `/api` via rewrite.

2) NestJS básico
- Criar DTOs e pipes de validação para `POST /tasks` e `PUT /tasks/:id`.
- Adicionar testes unitários do `TaskService` com repositório mockado.

3) TypeORM e migrações
- Trocar `synchronize` por migrações.
- Experimentar troca de SQLite para Postgres (já há compose com Postgres).

4) Observabilidade
- Adicionar logs estruturados (pino/winston) e métricas Prometheus.

5) Frontend UX
- Implementar otimizações otimistas e tratamento de erro detalhado.
- Adicionar paginação e busca de tarefas.


## Referências úteis

- Next.js App Router: https://nextjs.org/docs/app
- Server/Client Components: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns
- Fetch e cache/revalidate: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
- NestJS: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- Tailwind CSS: https://tailwindcss.com/docs
- Docker Compose: https://docs.docker.com/compose/


## Conclusão

Este projeto demonstra um CRUD full‑stack moderno: Next.js (Server/Client Components) e NestJS com TypeORM/SQLite. Dominar a separação de responsabilidades, HTTP correto, variáveis de ambiente, caching e orquestração com Docker te prepara para perguntas comuns de entrevistas e para evoluir o sistema com segurança.
