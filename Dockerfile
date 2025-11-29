FROM node:20-slim

ENV HOST=0.0.0.0
ENV PORT=5456

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 5456

CMD ["pnpm", "dev", "--port", "5456", "--host"]
