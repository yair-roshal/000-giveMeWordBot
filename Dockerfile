# Use Ubuntu as the base image
FROM ubuntu:latest AS base
# Set the working directory to /app
WORKDIR /app
# Copy the package.json and package-lock.json files to the container
COPY package*.json ./
# Install any necessary dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm
# Install any necessary npm packages
RUN npm install
# Copy the rest of the application code to the container
COPY . .
# Expose port 3000
EXPOSE 3000
# Start the application
CMD ["npm", "start"]

ENV NODE_ENV prod


