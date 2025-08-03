#!/bin/bash

# Cloud File Storage System Setup Script
# This script automates the setup process for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js version $(node -v) is compatible"
            return 0
        else
            print_error "Node.js version $(node -v) is too old. Please install Node.js 16 or higher."
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        return 1
    fi
}

# Function to check MySQL
check_mysql() {
    if command_exists mysql; then
        print_success "MySQL is installed"
        return 0
    else
        print_warning "MySQL is not installed. Please install MySQL 8.0 or higher."
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            sudo apt-get update
            sudo apt-get install -y curl git build-essential
        elif command_exists yum; then
            # CentOS/RHEL
            sudo yum update -y
            sudo yum install -y curl git gcc-c++ make
        elif command_exists dnf; then
            # Fedora
            sudo dnf update -y
            sudo dnf install -y curl git gcc-c++ make
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew update
            brew install curl git
        else
            print_warning "Homebrew not found. Please install Homebrew first."
        fi
    fi
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create environment file
    if [ ! -f .env ]; then
        print_status "Creating environment file..."
        cp env.example .env
        print_warning "Please edit backend/.env with your configuration"
    else
        print_success "Environment file already exists"
    fi
    
    # Create logs directory
    mkdir -p logs
    
    cd ..
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create environment file
    if [ ! -f .env ]; then
        print_status "Creating environment file..."
        cp env.example .env
        print_warning "Please edit frontend/.env with your configuration"
    else
        print_success "Environment file already exists"
    fi
    
    cd ..
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ ! -f database/schema.sql ]; then
        print_error "Database schema file not found"
        return 1
    fi
    
    print_warning "Please ensure MySQL is running and you have the correct credentials"
    print_status "You can run the database setup manually with:"
    echo "mysql -u your_username -p < database/schema.sql"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cloud-storage-api',
      script: './backend/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
EOF
    
    print_success "PM2 configuration created"
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Backend start script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
npm run dev
EOF
    chmod +x start-backend.sh
    
    # Frontend start script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm start
EOF
    chmod +x start-frontend.sh
    
    # Production start script
    cat > start-production.sh << 'EOF'
#!/bin/bash
# Start backend with PM2
pm2 start ecosystem.config.js --env production

# Build and serve frontend
cd frontend
npm run build
npx serve -s build -l 3000
EOF
    chmod +x start-production.sh
    
    print_success "Startup scripts created"
}

# Function to create Docker files
create_docker_files() {
    print_status "Creating Docker configuration..."
    
    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
EOF
    
    # Frontend Dockerfile
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Docker Compose
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: cloud_storage
      MYSQL_USER: clouduser
      MYSQL_PASSWORD: cloudpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=cloud_storage
      - DB_USER=clouduser
      - DB_PASSWORD=cloudpassword
    ports:
      - "5000:5000"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
EOF
    
    print_success "Docker configuration created"
}

# Function to create nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
    
    print_success "Nginx configuration created"
}

# Function to display next steps
show_next_steps() {
    echo
    print_success "Setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Configure your environment files:"
    echo "   - Edit backend/.env with your database and AWS credentials"
    echo "   - Edit frontend/.env with your API URL"
    echo
    echo "2. Set up your database:"
    echo "   mysql -u your_username -p < database/schema.sql"
    echo
    echo "3. Start the application:"
    echo "   Development:"
    echo "     ./start-backend.sh  # Terminal 1"
    echo "     ./start-frontend.sh # Terminal 2"
    echo
    echo "   Production:"
    echo "     ./start-production.sh"
    echo
    echo "   Docker:"
    echo "     docker-compose up -d"
    echo
    echo "4. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   API Documentation: http://localhost:5000/api-docs"
    echo
    echo "5. Default admin credentials:"
    echo "   Email: admin@cloudstorage.com"
    echo "   Password: admin123"
    echo
    print_warning "Remember to change default passwords and configure SSL for production!"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Cloud File Storage System Setup"
    echo "=========================================="
    echo
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Node.js version check failed"
        exit 1
    fi
    
    if ! check_mysql; then
        print_warning "MySQL check failed - you'll need to install it manually"
    fi
    
    # Install system dependencies
    install_dependencies
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Setup database
    setup_database
    
    # Create additional configuration files
    create_pm2_config
    create_startup_scripts
    create_docker_files
    create_nginx_config
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@" 