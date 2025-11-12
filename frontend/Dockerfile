# Use Node 18 image
FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start frontend dev server
CMD ["npm", "run", "dev", "--", "--host"]
