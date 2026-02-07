FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate

CMD ["npm", "run", "docker:dev"]
