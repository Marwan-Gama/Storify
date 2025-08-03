# Storify - Cloud File Storage System

A comprehensive cloud file storage system built with Node.js, Express, MySQL, and AWS S3. Features include file upload/download, folder management, user authentication, file sharing, and advanced file processing capabilities.

## 🚀 Features

### Core Features

- **File Management**: Upload, download, preview, and organize files
- **Folder System**: Hierarchical folder structure with nested folders
- **User Authentication**: JWT-based authentication with role-based access
- **File Sharing**: Public and private file sharing with secure links
- **File Preview**: Support for images, videos, PDFs, and text files
- **Search & Filter**: Advanced search and filtering capabilities
- **Trash Management**: Soft delete with restore functionality

### Advanced Features

- **AWS S3 Integration**: Scalable cloud storage with automatic backup
- **Image Processing**: Automatic thumbnail generation with Sharp
- **File Versioning**: Track file versions and changes
- **Batch Operations**: Upload multiple files simultaneously
- **Progress Tracking**: Real-time upload/download progress
- **Security**: File encryption, access control, and rate limiting
- **API Documentation**: Complete Swagger/OpenAPI documentation

### Technical Features

- **RESTful API**: Clean, well-documented REST API
- **Database**: MySQL with Sequelize ORM
- **Testing**: Comprehensive test suite with Jest
- **Error Handling**: Robust error handling and logging
- **Validation**: Input validation and sanitization
- **Performance**: Optimized queries and caching
- **Monitoring**: Health checks and performance metrics

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- AWS Account with S3 bucket
- Redis (optional, for caching)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Storify
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create `.env` files in the backend directory:

```bash
# Backend .env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cloud_storage
DB_NAME_TEST=cloud_storage_test

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# App Configuration
APP_URL=http://localhost:3000

# File Upload Limits
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,text/plain
FREE_TIER_LIMIT=1073741824
PREMIUM_TIER_LIMIT=10737418240

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 4. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE cloud_storage;
CREATE DATABASE cloud_storage_test;
EXIT;

# Run migrations
cd backend
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Configure CORS for the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

3. Set bucket permissions and policies as needed

## 🚀 Running the Application

### Development Mode

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in CI mode
npm run test:ci
```

### Test Database Setup

```bash
# Setup test database
npm run db:test:setup

# Teardown test database
npm run db:test:teardown
```

### Test Coverage

The project maintains 80%+ test coverage across:

- Controllers
- Services
- Middleware
- Models
- Routes

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Available Endpoints

#### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Forgot password
- `POST /auth/reset-password` - Reset password

#### Files

- `GET /files` - Get user files
- `POST /files/upload` - Upload single file
- `POST /files/upload-multiple` - Upload multiple files
- `GET /files/:id` - Get file details
- `GET /files/:id/download` - Download file
- `GET /files/:id/preview` - Get file preview URL
- `PUT /files/:id` - Update file
- `DELETE /files/:id` - Delete file (soft delete)
- `DELETE /files/:id/permanent` - Permanently delete file
- `POST /files/:id/restore` - Restore file from trash
- `GET /files/stats` - Get file statistics
- `GET /files/public/:publicLink` - Get public file

#### Folders

- `GET /folders` - Get user folders
- `GET /folders/tree` - Get folder tree structure
- `POST /folders` - Create folder
- `GET /folders/:id` - Get folder details
- `PUT /folders/:id` - Update folder
- `DELETE /folders/:id` - Delete folder (soft delete)
- `DELETE /folders/:id/permanent` - Permanently delete folder
- `POST /folders/:id/restore` - Restore folder from trash
- `GET /folders/stats` - Get folder statistics
- `GET /folders/public/:publicLink` - Get public folder

#### Shares

- `GET /shares` - Get user shares
- `POST /shares` - Create share
- `GET /shares/:id` - Get share details
- `PUT /shares/:id` - Update share
- `DELETE /shares/:id` - Delete share

### Interactive API Documentation

Access the interactive Swagger documentation at:

```
http://localhost:5000/api-docs
```

## 🏗️ Project Structure

```
Storify/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── folderController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── File.js
│   │   ├── Folder.js
│   │   ├── Share.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── folders.js
│   │   └── shares.js
│   ├── services/
│   │   ├── s3Service.js
│   │   └── emailService.js
│   ├── tests/
│   │   ├── fileController.test.js
│   │   ├── folderController.test.js
│   │   ├── setup.js
│   │   └── env.js
│   ├── scripts/
│   ├── logs/
│   ├── server.js
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── database/
├── deployment/
├── logs/
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description        | Default                                              |
| ----------------------- | ------------------ | ---------------------------------------------------- |
| `NODE_ENV`              | Environment mode   | `development`                                        |
| `PORT`                  | Server port        | `5000`                                               |
| `DB_HOST`               | Database host      | `localhost`                                          |
| `DB_PORT`               | Database port      | `3306`                                               |
| `DB_USER`               | Database user      | `root`                                               |
| `DB_PASSWORD`           | Database password  | -                                                    |
| `DB_NAME`               | Database name      | `cloud_storage`                                      |
| `JWT_SECRET`            | JWT secret key     | -                                                    |
| `AWS_ACCESS_KEY_ID`     | AWS access key     | -                                                    |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key     | -                                                    |
| `AWS_REGION`            | AWS region         | `us-east-1`                                          |
| `AWS_S3_BUCKET`         | S3 bucket name     | -                                                    |
| `MAX_FILE_SIZE`         | Maximum file size  | `104857600` (100MB)                                  |
| `ALLOWED_FILE_TYPES`    | Allowed file types | `image/*,video/*,audio/*,application/pdf,text/plain` |

### File Upload Configuration

```javascript
// File size limits
FREE_TIER_LIMIT: 1GB
PREMIUM_TIER_LIMIT: 10GB

// Allowed file types
ALLOWED_FILE_TYPES: [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password hashing
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing protection
- **File Type Validation**: Strict file type checking
- **Access Control**: Role-based access control
- **SQL Injection Protection**: Parameterized queries with Sequelize
- **XSS Protection**: Helmet.js security headers

## 📊 Performance Optimization

- **Database Indexing**: Optimized database indexes
- **Query Optimization**: Efficient database queries
- **File Streaming**: Stream large files for better performance
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Gzip compression for responses
- **CDN Integration**: CloudFront integration for static assets
- **Connection Pooling**: Database connection pooling

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t storify .

# Run container
docker run -p 5000:5000 storify
```

### Production Deployment

1. **Environment Setup**

   ```bash
   NODE_ENV=production
   ```

2. **Database Migration**

   ```bash
   npm run db:migrate
   ```

3. **Build Application**

   ```bash
   npm run build
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### AWS Deployment

1. **EC2 Setup**

   - Launch EC2 instance
   - Install Node.js and MySQL
   - Configure security groups

2. **S3 Configuration**

   - Create S3 bucket
   - Configure CORS and permissions
   - Set up CloudFront distribution

3. **RDS Setup**

   - Create RDS MySQL instance
   - Configure security groups
   - Update database connection

4. **Load Balancer**
   - Set up Application Load Balancer
   - Configure SSL certificates
   - Set up auto-scaling

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

   ```bash
   # Check database service
   sudo systemctl status mysql

   # Check connection
   mysql -u root -p -h localhost
   ```

2. **S3 Upload Error**

   ```bash
   # Check AWS credentials
   aws configure list

   # Test S3 access
   aws s3 ls s3://your-bucket-name
   ```

3. **File Upload Size Limit**

   ```bash
   # Check nginx configuration
   client_max_body_size 100M;

   # Check Express body parser
   app.use(express.json({ limit: '50mb' }));
   ```

### Logs

Check application logs:

```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Test logs
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Maintain code coverage above 80%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

## 🔄 Changelog

### Version 1.0.0

- Initial release
- Core file management features
- User authentication
- AWS S3 integration
- Comprehensive testing suite
- API documentation

## 🙏 Acknowledgments

- AWS S3 for cloud storage
- Sharp for image processing
- Sequelize for database ORM
- Jest for testing framework
- Swagger for API documentation
