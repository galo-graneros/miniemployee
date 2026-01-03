#!/bin/bash

# ===========================================
# Digital Ocean Droplet Setup Script
# ===========================================
# Run this script on a fresh Ubuntu 22.04 Droplet
# wget -O setup.sh https://raw.githubusercontent.com/galo-graneros/miniemployee/main/apps/worker/setup-droplet.sh
# chmod +x setup.sh && sudo ./setup.sh

set -e

echo "🚀 Setting up MiniEmployee Worker on Digital Ocean..."

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
echo "📦 Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /opt/miniemployee
cd /opt/miniemployee

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/galo-graneros/miniemployee.git .

# Navigate to worker
cd apps/worker

# Create .env file
echo "📝 Creating environment file..."
cat > .env << 'EOF'
# Fill in your values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
WORKER_ID=do-droplet-worker
LOG_LEVEL=INFO
POLL_INTERVAL=2
EOF

echo ""
echo "⚠️  IMPORTANT: Edit /opt/miniemployee/apps/worker/.env with your actual values!"
echo "   nano /opt/miniemployee/apps/worker/.env"
echo ""

# Build Docker image
echo "🏗️  Building Docker image..."
docker build -t miniemployee-worker .

# Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/miniemployee-worker.service << 'EOF'
[Unit]
Description=MiniEmployee AI Worker
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
WorkingDirectory=/opt/miniemployee/apps/worker
ExecStartPre=-/usr/bin/docker stop miniemployee-worker
ExecStartPre=-/usr/bin/docker rm miniemployee-worker
ExecStart=/usr/bin/docker run --rm --name miniemployee-worker --env-file /opt/miniemployee/apps/worker/.env miniemployee-worker
ExecStop=/usr/bin/docker stop miniemployee-worker

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit environment variables:"
echo "      nano /opt/miniemployee/apps/worker/.env"
echo ""
echo "   2. Start the worker:"
echo "      systemctl start miniemployee-worker"
echo ""
echo "   3. Enable auto-start on boot:"
echo "      systemctl enable miniemployee-worker"
echo ""
echo "   4. Check logs:"
echo "      journalctl -u miniemployee-worker -f"
echo ""
echo "   5. Check status:"
echo "      systemctl status miniemployee-worker"
echo ""
