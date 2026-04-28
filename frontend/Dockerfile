# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the Next.js app
RUN npm run build

# Cloud Run uses the $PORT environment variable
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
