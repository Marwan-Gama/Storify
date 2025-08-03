# Cloud File Storage System

A full-stack cloud file storage system built with Node.js, React, MySQL, and AWS S3.

## 🚀 Features

### 🔐 Authentication & User Management

- User registration and login with JWT
- Password reset via email
- Profile management
- Email verification (optional)

### 🗃️ File & Folder Management

- Drag-and-drop file upload with progress
- File download and preview
- File/folder rename and delete
- Folder hierarchy management
- Soft delete with trash bin

### 📤 File Sharing

- Share files with users by email
- Generate public/private shareable links
- Link permissions (view, edit, download)
- Expiration dates for links

### 🔍 Search & Organization

- Real-time search
- Filter by file type
- Sort by name, size, date
- Storage usage tracking

### 🛡️ Security

- JWT authentication
- Secure file storage on AWS S3
- Role-based access control
- Admin panel for user management

## 🏗️ Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Storage**: AWS S3
- **Email**: Nodemailer
- **Logging**: Winston

### Frontend

- **Framework**: React.js
- **UI Library**: Material-UI
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **File Upload**: React Dropzone

### Infrastructure

- **Cloud Storage**: AWS S3
- **Deployment**: AWS EC2
- **CDN**: CloudFront (optional)

## 📁 Project Structure

```
cloud-file-storage/
├── backend/                 # Node.js + Express API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Entry point
├── frontend/              # React application
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── package.json
├── database/             # Database migrations & seeds
├── docs/                # Documentation
└── deployment/          # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- MySQL (v8+)
- AWS Account with S3 access
- Git

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cloud-file-storage/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cloud_storage
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App
APP_URL=http://localhost:3000
API_URL=http://localhost:5000
```

#### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_APP_NAME=Cloud Storage
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### File Management Endpoints

- `GET /api/files` - Get user files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file details
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/:id/download` - Download file

### Folder Management Endpoints

- `GET /api/folders` - Get user folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Sharing Endpoints

- `POST /api/shares` - Share file/folder
- `GET /api/shares` - Get shared items
- `PUT /api/shares/:id` - Update share settings
- `DELETE /api/shares/:id` - Remove share

### Admin Endpoints

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system stats

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## 🚀 Deployment

### Backend Deployment (AWS EC2)

1. **Launch EC2 instance**
2. **Install Node.js and MySQL**
3. **Clone repository**
4. **Setup environment variables**
5. **Install PM2 for process management**
6. **Setup Nginx reverse proxy**
7. **Configure SSL with Let's Encrypt**

### Frontend Deployment (Vercel/Netlify)

1. **Connect repository to Vercel/Netlify**
2. **Configure build settings**
3. **Set environment variables**
4. **Deploy**

### Database Setup

1. **Create RDS instance (optional)**
2. **Run migrations**
3. **Seed initial data**

## 📊 Monitoring & Logging

- **Application Logs**: Winston
- **Error Tracking**: Sentry (optional)
- **Performance**: New Relic (optional)
- **Uptime**: UptimeRobot (optional)

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- File type validation
- Virus scanning (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@cloudstorage.com or create an issue in the repository.
