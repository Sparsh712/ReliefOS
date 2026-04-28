# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Provide the backend URL directly so Next.js bakes it into the build
ENV NEXT_PUBLIC_API_URL=https://reliefos-backend-695185997616.asia-south1.run.app

# Build the Next.js app
RUN npm run build

# Cloud Run uses the $PORT environment variable
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
