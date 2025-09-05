# Use the official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app source code
COPY . .

# Expose the port your app runs on (change if needed)
EXPOSE 3000

# Start both the API and worker using concurrently
CMD ["npm", "run", "dev"]
