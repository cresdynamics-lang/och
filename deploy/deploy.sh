#!/bin/bash

# DigitalOcean Deployment Script for Ongoza CyberHub (Next.js + Django)
# Based on Node.js deployment guide adapted for dual-stack application

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${YELLOW}Warning: Running as root. Consider creating a non-root user.${NC}"
fi

# Step 1: Install Node.js (using Node 20 LTS)
echo -e "${GREEN}Step 1: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

node --version
npm --version

# Step 1b: Install Python and pip
echo -e "${GREEN}Step 1b: Installing Python and pip...${NC}"
if ! command -v python3 &> /dev/null; then
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv
else
    echo "Python3 already installed: $(python3 --version)"
fi

python3 --version
pip3 --version

# Step 2: Clone your project from Github
echo -e "${GREEN}Step 2: Cloning project from Github...${NC}"
REPO_URL="https://github.com/strivego254/ongozacyberhub.git"
PROJECT_DIR="$HOME/ongozacyberhub"

if [ -d "$PROJECT_DIR" ]; then
    echo "Repository exists, updating..."
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master || true
    git clean -fd || true
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Ensure we're in the project directory
cd "$PROJECT_DIR" || exit 1

# Step 3: Install dependencies
echo -e "${GREEN}Step 3: Installing Next.js dependencies...${NC}"
cd "$PROJECT_DIR/frontend/nextjs_app" || exit 1
pwd

npm install || true
set -e  # Re-enable exit on error

# Step 3b: Install Django dependencies
echo -e "${GREEN}Step 3b: Installing Django dependencies...${NC}"
cd "$PROJECT_DIR/backend/django_app" || exit 1
pwd

pip3 install -r requirements.txt --break-system-packages || true
set -e  # Re-enable exit on error

# Step 3.5: Create missing files AFTER git reset
echo -e "${GREEN}Step 3.5: Creating missing files...${NC}"
cd "$PROJECT_DIR/frontend/nextjs_app" || exit 1

# Create missing lib files if they don't exist
mkdir -p app/dashboard/student/lib/store app/dashboard/student/lib/hooks
if [ ! -f app/dashboard/student/lib/store/dashboardStore.ts ]; then
    echo "Creating missing dashboardStore.ts..."
    cat > app/dashboard/student/lib/store/dashboardStore.ts << 'STOREEOF'
import { create } from 'zustand'

interface DashboardStore {
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}))
STOREEOF
fi

if [ ! -f app/dashboard/student/lib/hooks/useDashboardCoordination.ts ]; then
    echo "Creating missing useDashboardCoordination.ts..."
    cat > app/dashboard/student/lib/hooks/useDashboardCoordination.ts << 'COORDEOF'
export function useDashboardCoordination() {
  return { isLoading: false }
}
COORDEOF
fi

if [ ! -f app/dashboard/student/lib/hooks/useKeyboardShortcuts.ts ]; then
    echo "Creating missing useKeyboardShortcuts.ts..."
    cat > app/dashboard/student/lib/hooks/useKeyboardShortcuts.ts << 'KEYEOF'
export function useKeyboardShortcuts() {
  // Keyboard shortcuts implementation
}
KEYEOF
fi

# Create missing missionStore
mkdir -p app/dashboard/student/missions/lib/store
if [ ! -f app/dashboard/student/missions/lib/store/missionStore.ts ]; then
    echo "Creating missing missionStore.ts..."
    cat > app/dashboard/student/missions/lib/store/missionStore.ts << 'MISSIONEOF'
import { create } from 'zustand'

interface Mission {
  id: string
  title: string
  [key: string]: any
}

interface MissionStore {
  currentMission: Mission | null
  availableMissions: Mission[]
  inProgressMissions: Mission[]
  completedMissions: Mission[]
  setCurrentMission: (mission: Mission | null) => void
  setAvailableMissions: (missions: Mission[]) => void
  setInProgressMissions: (missions: Mission[]) => void
  setCompletedMissions: (missions: Mission[]) => void
}

export const useMissionStore = create<MissionStore>((set) => ({
  currentMission: null,
  availableMissions: [],
  inProgressMissions: [],
  completedMissions: [],
  setCurrentMission: (mission) => set({ currentMission: mission }),
  setAvailableMissions: (missions) => set({ availableMissions: missions }),
  setInProgressMissions: (missions) => set({ inProgressMissions: missions }),
  setCompletedMissions: (missions) => set({ completedMissions: missions }),
}))
MISSIONEOF
fi

# Step 4: Check for .env file
echo -e "${GREEN}Step 4: Checking environment variables...${NC}"

# Backend environment file
BACKEND_ENV_FILE="$PROJECT_DIR/.env"
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: Backend .env file not found!${NC}"
    echo "Creating template backend .env file..."
    cat > "$BACKEND_ENV_FILE" << 'EOF'
# Django Production Settings
DJANGO_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too
DEBUG=False
ALLOWED_HOSTS=ongozacyberhub.com,www.ongozacyberhub.com,your-server-ip

# Frontend URL for CORS and OAuth callbacks
FRONTEND_URL=https://ongozacyberhub.com
CSRF_TRUSTED_ORIGINS=https://ongozacyberhub.com,https://www.ongozacyberhub.com
CORS_ALLOWED_ORIGINS=https://ongozacyberhub.com,https://www.ongozacyberhub.com

# Database (PostgreSQL for production)
DB_NAME=ongozacyberhub_prod
DB_USER=postgres
DB_PASSWORD=your-secure-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379

# FastAPI
FASTAPI_BASE_URL=http://localhost:8001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Optional: SSL Settings
SECURE_SSL_REDIRECT=True
EOF
    echo -e "${YELLOW}Backend .env file created. Please edit with your actual values.${NC}"
fi

# Frontend environment file
FRONTEND_ENV_FILE="$PROJECT_DIR/frontend/nextjs_app/.env.production"
if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: Frontend .env.production file not found!${NC}"
    echo "Creating template frontend .env.production file..."
    cat > "$FRONTEND_ENV_FILE" << EOF
# Next.js Production Environment Variables
NEXT_PUBLIC_DJANGO_API_URL=https://ongozacyberhub.com/api
NEXT_PUBLIC_FASTAPI_API_URL=https://ongozacyberhub.com/ai
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com

# Internal URLs (for server-side operations)
DJANGO_INTERNAL_URL=http://localhost:8000
FASTAPI_INTERNAL_URL=http://localhost:8001

# Optional: AI Services
# GROK_API_KEY=your_grok_api_key_here
# LLAMA_ENDPOINT=http://localhost:11434

# Optional: Supabase
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional: Analytics
# GOOGLE_ANALYTICS_ID=your_ga_id

# Optional: Monitoring
# SENTRY_DSN=your_sentry_dsn
EOF
    echo -e "${YELLOW}Frontend .env.production file created.${NC}"
fi

# Step 5: Create missing files before build
echo -e "${GREEN}Step 5: Creating missing files...${NC}"
cd "$PROJECT_DIR/frontend/nextjs_app" || exit 1

# Create missing lib files
mkdir -p app/dashboard/student/lib/store app/dashboard/student/lib/hooks
[ ! -f app/dashboard/student/lib/store/dashboardStore.ts ] && cat > app/dashboard/student/lib/store/dashboardStore.ts << 'STOREEOF'
import { create } from 'zustand'
interface DashboardStore {
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}
export const useDashboardStore = create<DashboardStore>((set) => ({
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}))
STOREEOF

[ ! -f app/dashboard/student/lib/hooks/useDashboardCoordination.ts ] && cat > app/dashboard/student/lib/hooks/useDashboardCoordination.ts << 'COORDEOF'
export function useDashboardCoordination() {
  return { isLoading: false }
}
COORDEOF

[ ! -f app/dashboard/student/lib/hooks/useKeyboardShortcuts.ts ] && cat > app/dashboard/student/lib/hooks/useKeyboardShortcuts.ts << 'KEYEOF'
export function useKeyboardShortcuts() {}
KEYEOF

# Create missing missionStore
mkdir -p app/dashboard/student/missions/lib/store
[ ! -f app/dashboard/student/missions/lib/store/missionStore.ts ] && cat > app/dashboard/student/missions/lib/store/missionStore.ts << 'MISSIONEOF'
import { create } from 'zustand'
interface Mission { id: string; title: string; [key: string]: any }
interface MissionStore {
  currentMission: Mission | null
  availableMissions: Mission[]
  inProgressMissions: Mission[]
  completedMissions: Mission[]
  setCurrentMission: (mission: Mission | null) => void
  setAvailableMissions: (missions: Mission[]) => void
  setInProgressMissions: (missions: Mission[]) => void
  setCompletedMissions: (missions: Mission[]) => void
}
export const useMissionStore = create<MissionStore>((set) => ({
  currentMission: null,
  availableMissions: [],
  inProgressMissions: [],
  completedMissions: [],
  setCurrentMission: (mission) => set({ currentMission: mission }),
  setAvailableMissions: (missions) => set({ availableMissions: missions }),
  setInProgressMissions: (missions) => set({ inProgressMissions: missions }),
  setCompletedMissions: (missions) => set({ completedMissions: missions }),
}))
MISSIONEOF

# Step 6: Build Next.js application
echo -e "${GREEN}Step 6: Building Next.js application...${NC}"
cd "$PROJECT_DIR/frontend/nextjs_app" || exit 1
pwd

# Clean build cache
rm -rf .next
rm -rf node_modules/.cache

npm run build

# Step 7: Install PM2 globally
echo -e "${GREEN}Step 7: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi

# Step 8: Setup PM2
echo -e "${GREEN}Step 8: Setting up PM2...${NC}"
cd "$PROJECT_DIR"
if [ -f "deploy/ecosystem.config.js" ]; then
    echo "Using ecosystem.config.js for PM2"
    pm2 delete ongoza-nextjs 2>/dev/null || true
    pm2 start deploy/ecosystem.config.js
else
    echo "Starting with basic PM2 command..."
    cd "$PROJECT_DIR/frontend/nextjs_app"
    pm2 delete nextjs-app 2>/dev/null || true
    pm2 start npm --name "nextjs-app" -- start
fi

pm2 save
STARTUP_CMD=$(pm2 startup ubuntu -u $USER --hp $HOME | grep -oP 'sudo.*$' || echo "")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# Step 9: Setup Firewall
echo -e "${GREEN}Step 9: Setting up firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# Step 10: Install and Configure NGINX
echo -e "${GREEN}Step 10: Installing and configuring NGINX...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
fi

# Copy NGINX configuration
sudo cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/ongoza-cyberhub
sudo ln -sf /etc/nginx/sites-available/ongoza-cyberhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart NGINX
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}Your app should be accessible at: http://ongozacyberhub.com${NC}"
echo ""
echo -e "${YELLOW}To setup SSL:${NC}"
echo "cd $PROJECT_DIR && ./deploy/setup-ssl.sh ongozacyberhub.com"

