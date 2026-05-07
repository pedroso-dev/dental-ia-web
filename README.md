# DentalAI 🦷✨

O **DentalAI** é um ecossistema focado na automação de prontuários e evoluções odontológicas utilizando Inteligência Artificial. O sistema permite que dentistas gravem suas consultas e recebam automaticamente um prontuário estruturado e formatado via e-mail, utilizando modelos avançados de Processamento de Linguagem Natural (LLM).

## 🚀 Diferenciais Técnicos (V1.1.0)

- **Resiliência Offline-First:** Gravação segura utilizando IndexedDB (via `idb-keyval`) para garantir que nenhum áudio seja perdido em caso de falha de conexão.
- **Arquitetura Event-Driven (Long-Running):** Processamento assíncrono orquestrado pelo Inngest, permitindo lidar com áudios extensos (até 1 hora) sem estourar limites de timeout de requisições web.
- **Upload de Baixa Latência:** Bypass do servidor principal utilizando Pre-signed URLs do AWS S3 SDK para upload direto no Cloudflare R2.
- **Progressive Web App (PWA):** Instalação nativa em dispositivos móveis já configurada, proporcionando uma experiência de app mobile para os dentistas.

## 🏗️ Stack Tecnológica

- **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), React 19, Tailwind CSS v4.
- **Backend & Workers:** Inngest (Job Scheduling & Orquestração).
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL).
- **File Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (compatível com S3 API).
- **AI Engine:** Google AI Studio (Modelo: `gemini-2.5-flash`).
- **Email Service:** [Resend](https://resend.com/).

## 📂 Estrutura de Diretórios e Clean Code

O projeto segue princípios de separação de responsabilidades e Clean Architecture através de Custom Hooks:

- `src/app/hooks/useAudioRecorder.ts`: Gerencia a API de MediaRecorder do navegador, o timer e a persistência local (IndexedDB).
- `src/app/hooks/useProntuarioUpload.ts`: Orquestra o fluxo de rede (Cloudflare R2 -> Inngest Trigger).
- `src/inngest/functions.ts`: Contém o "Worker" (`process-audio-and-send-email`) que executa o processamento pesado de IA em background.

## 🔄 Fluxo de Dados

1.  **Capture:** Áudio capturado via navegador e salvo no IndexedDB.
2.  **Storage:** Upload direto do navegador para o Cloudflare R2 via Pre-signed URL.
3.  **Trigger:** Evento enviado para a fila do Inngest (`audio/process.requested`).
4.  **Process:** O Worker baixa o áudio do R2, envia para a API do Gemini via Google File API e gera a evolução estruturada.
5.  **Persist:** O prontuário em texto é salvo na tabela `prontuarios` no Supabase.
6.  **Notify:** O Resend envia o prontuário formatado para o e-mail do dentista.
7.  **Cleanup:** O áudio original é removido do R2, do diretório temporário do servidor e do IndexedDB, garantindo máxima conformidade com a LGPD.

## 🛠️ Configuração de Ambiente

O projeto utiliza um arquivo de exemplo para o mapeamento das variáveis de ambiente. Para rodar localmente:

1. Duplique o arquivo `.env.example` na raiz do repositório.
2. Renomeie a cópia para `.env.local`.
3. Preencha as chaves de API correspondentes de cada serviço.
   _(Nota: Em desenvolvimento local, a variável `INNGEST_DEV=1` presente no arquivo de exemplo dispensa o uso de chaves do servidor remoto do Inngest)._

## 📜 Padrões de Desenvolvimento

- **Commits:** Sempre em Inglês seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/).
- **Branches:** \* `feature/` para novas funcionalidades.
  - `fix/` para correção de bugs.
  - `refactor/` para melhorias estruturais de código.
- **Versão:** Gerenciada via `npm version [patch|minor|major]` e refletida no `package.json`.

## 🛤️ Próximos Passos (Backlog)

- [ ] Implementação da Arquitetura Multitenant com Row Level Security (RLS) no Supabase.
- [ ] Motor de Prompts Dinâmicos customizáveis por Clínica/Inquilino.
- [ ] Dashboard de monitoramento de status em Real-time via Supabase WebSockets.
