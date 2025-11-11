# ===========================
# Stage 1 — Build React App
# ===========================
FROM node:18-alpine AS build

WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Run build
RUN npm run build

# Check if build directory exists (debug line)
RUN ls -la /app/build

# ===========================
# Stage 2 — Serve with Nginx
# ===========================
FROM nginx:1.23-alpine

# Clean the default nginx html content
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app from previous stage
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
