# 1. Imagem base super leve
FROM node:20-alpine AS base

# 2. Instalar dependências (fase de deps)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Compilar a aplicação (fase de builder)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Imagem final de Produção (fase runner)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar um utilizador sem privilégios de root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar permissões para cache do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar APENAS os ficheiros necessários do builder (Magia do standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O Next.js standalone gera um server.js limpo na raiz
CMD ["node", "server.js"]