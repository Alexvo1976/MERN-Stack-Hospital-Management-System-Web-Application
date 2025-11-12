# Use official Node 18 image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install dependencies (inside container to avoid host OS conflicts)
RUN npm install

# Copy rest of backend code
COPY . .

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
