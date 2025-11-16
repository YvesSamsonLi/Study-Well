FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Install deps
COPY package*.json ./

RUN npm ci
# If your project doesn't already have prisma CLI as devDep:
RUN npm i -D prisma

# Copy source (compose will also mount it for live dev)
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
