# 🦷 DentalAI Assistant - MVP

Um sistema inteligente para automação de prontuários odontológicos hospitalares. O aplicativo grava o áudio da consulta, realiza o upload seguro para a nuvem e utiliza Inteligência Artificial (Google Gemini) para gerar uma evolução clínica estruturada no padrão ISO de Odontologia Hospitalar.

## 🚀 Funcionalidades

- **Gravação de Áudio Nativa:** Captura de áudio direto no navegador com feedback visual e cronômetro.
- **Armazenamento Seguro (Cloudflare R2):** Upload de arquivos `.webm` utilizando AWS S3 SDK com geração de Pre-signed URLs para máxima segurança.
- **Processamento com IA (Google Gemini):** Transcrição e formatação automática do áudio em um prontuário clínico detalhado, focando em jargões técnicos (ex: "hígido", "mesial").
- **Assinatura Dinâmica:** Inclusão automática do nome e CROSP do profissional no final do prontuário.

## 🛠️ Tecnologias Utilizadas

- **Frontend/Backend:** Next.js 16 (App Router) + React 19
- **Estilização:** Tailwind CSS v4
- **Armazenamento (Storage):** Cloudflare R2 (compatível com API S3)
- **Inteligência Artificial:** Google AI SDK (Modelo: `gemini-2.5-flash` / `gemini-1.5-pro`)

## ⚙️ Configuração do Ambiente Local

Para rodar este projeto na sua máquina, você precisará configurar as variáveis de ambiente.

1. Clone o repositório.
2. Crie um arquivo chamado `.env.local` na raiz do projeto.
3. Adicione as seguintes chaves (substitua pelos seus dados reais):

```env
# Cloudflare R2 (Armazenamento de Áudio)
R2_ACCOUNT_ID="seu_account_id_aqui"
R2_ACCESS_KEY_ID="sua_access_key_aqui"
R2_SECRET_ACCESS_KEY="sua_secret_key_aqui"
R2_BUCKET_NAME="dental-ai-audio-dev"

# Google AI Studio (Processamento e Transcrição)
GOOGLE_AI_API_KEY="sua_chave_do_gemini_aqui"
```

## 📦 Configuração do Ambiente Local

Instale as dependências:

```Bash
npm install
```

Inicie o servidor de desenvolvimento:

```Bash
npm run dev
```
Abra http://localhost:3000 no seu navegador para ver a aplicação.

## ⚠️ Notas de Deploy (Vercel)

Ao realizar o deploy na Vercel:

1. Certifique-se de cadastrar todas as variáveis de ambiente citadas acima nas configurações do projeto na Vercel.
2. Adicione a URL de produção gerada pela Vercel nas regras de CORS Policy dentro do painel do seu bucket no Cloudflare R2.

### Tudo pronto para a decolagem! 🚀