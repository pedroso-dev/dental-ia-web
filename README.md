# DentalAI Assistant 🦷🤖

Uma solução full-stack de alta performance desenhada para automatizar a burocracia clínica na odontologia. O sistema transcreve áudios de consultas longas (até 30 min) e utiliza LLMs para gerar evoluções de prontuário estruturadas.

## 🏗️ Arquitetura & Decisões Técnicas

* **Frontend:** Next.js (React) com Tailwind CSS, focado em UX responsiva e escalabilidade.
* **Backend/Worker:** Escrito em **Go (Golang)**, operando de forma assíncrona para processar filas de áudios pesados sem bloquear o cliente.
* **Storage:** Upload direto para **Cloudflare R2** via Pre-signed URLs, otimizando custo de infraestrutura e latência.
* **IA Engine:** Orquestração entre Whisper API (STT) para transcrição e Gemini/GPT (LLM) para extração de jargões técnicos odontológicos e formatação.

## 🚀 Status do Projeto
Em desenvolvimento (Fase MVP).