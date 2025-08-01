# Use Bun's official image as base
FROM oven/bun:1 as base

# Set working directory
WORKDIR /app

# Install git for cloning rlib and curl for healthcheck
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# # Clone rlib repository locally
# RUN git clone https://github.com/rizrmd/rlib.git ./rlib

# Modify package.json to use local rlib
# RUN sed -i 's/"rlib": "https:\/\/github.com\/rizrmd\/rlib.git"/"rlib": "file:.\/rlib"/' package.json

# Install dependencies with local rlib

# Copy source code
COPY . .

RUN bun install

# Generate Prisma client
RUN cd shared && bun prisma generate

# Expose the production port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
  
# Start the application
CMD ["bun", "run", "prod"]