FROM node:alpine

# Set working directory
WORKDIR /app

# Copy package.json to working directory
COPY package.json .

# Install dependencies
RUN yarn

# Copy all files to working directory
COPY . .

# Build the app
RUN yarn build

# Expose port 3000
EXPOSE 3000

# Run the app
CMD ["yarn", "start"]