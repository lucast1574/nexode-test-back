FROM node:20-bullseye-slim

# Install system dependencies if required
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS project
RUN npm run build

# Expose default NestJS port
EXPOSE 4000

# Start the server
CMD ["npm", "run", "start:prod"]
