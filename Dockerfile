FROM node:20-bookworm

# Install system dependencies for Electron
RUN apt-get update && apt-get install -y \
    # Electron dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxshmfence1 \
    # For X11 forwarding
    libx11-6 \
    libxext6 \
    libxrender1 \
    x11-utils \
    # Fonts
    fonts-liberation \
    fonts-noto-color-emoji \
    # Utils
    dbus \
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Set environment variables for Electron
ENV ELECTRON_DISABLE_SANDBOX=1
ENV DISPLAY=:0

# Run the app
CMD ["bun", "run", "dev"]
