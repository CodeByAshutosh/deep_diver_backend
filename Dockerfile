FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Verify dist folder exists
RUN ls -la dist/

EXPOSE 3000

# Start the application with better error handling
CMD ["node", "dist/index.js"]
