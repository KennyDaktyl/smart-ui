    FROM node:20-slim AS builder

    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"
    
    RUN corepack enable && corepack prepare pnpm@latest --activate
    
    WORKDIR /app
    
    COPY package.json pnpm-lock.yaml ./
    RUN pnpm install
    
    COPY . .
    RUN pnpm build
    
    
    FROM nginx:stable-alpine
    
    RUN rm -rf /usr/share/nginx/html/*
    
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 3000
    
    CMD ["nginx", "-g", "daemon off;"]
    