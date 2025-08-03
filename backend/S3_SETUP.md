# AWS S3 Setup Guide for Storify

## 🔗 **Complete AWS S3 Connection Guide**

### **Step 1: AWS Account Setup**

1. **Create AWS Account** (if you don't have one):
   - Go to [AWS Console](https://aws.amazon.com/)
   - Sign up for a free account
   - Verify your email and phone number

2. **Create IAM User**:
   - Go to IAM Console → Users → Create User
   - Name: `storify-s3-user`
   - Select "Programmatic access"
   - Attach policy: `AmazonS3FullAccess` (for development) or create custom policy

3. **Get Access Keys**:
   - After creating user, download the CSV with:
     - `Access Key ID`
     - `Secret Access Key`

### **Step 2: Create S3 Bucket**

1. **Go to S3 Console**:
   - Click "Create bucket"
   - Bucket name: `storify-cloud-storage-[your-unique-id]`
   - Region: Choose closest to your users
   - Block all public access: **Uncheck** (for public files)
   - Enable versioning: **Check**

2. **Configure CORS** (for web uploads):

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag", "Content-Length"]
     }
   ]
   ```

3. **Bucket Policy** (for public access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

### **Step 3: Environment Configuration**

Create `.env` file in your `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cloud_storage
DB_NAME_TEST=cloud_storage_test

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=storify-cloud-storage-your-unique-id

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Application Configuration
APP_URL=http://localhost:3000
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Storage Limits (in bytes)
FREE_TIER_LIMIT=1073741824
PREMIUM_TIER_LIMIT=10737418240

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### **Step 4: Test S3 Connection**

Run this command to test your S3 connection:

```bash
cd backend
npm run test:s3
```

Or create a simple test script:

```javascript
// test-s3.js
const s3Service = require("./services/s3Service");

async function testS3Connection() {
  try {
    console.log("Testing S3 connection...");

    // Test bucket access
    const stats = await s3Service.getBucketStats();
    console.log("✅ S3 connection successful!");
    console.log("Bucket stats:", stats);
  } catch (error) {
    console.error("❌ S3 connection failed:", error.message);
    console.log("Please check your AWS credentials and bucket configuration");
  }
}

testS3Connection();
```

### **Step 5: Security Best Practices**

1. **IAM Policy** (instead of full access):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket",
           "s3:GetBucketLocation"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

2. **Environment Variables**:
   - Never commit `.env` files to git
   - Use different credentials for development/production
   - Rotate access keys regularly

3. **Bucket Security**:
   - Enable server-side encryption
   - Use bucket policies for access control
   - Enable access logging

### **Step 6: Troubleshooting**

**Common Issues:**

1. **Access Denied Error**:
   - Check IAM permissions
   - Verify bucket name in environment
   - Ensure bucket exists in correct region

2. **CORS Errors**:
   - Verify CORS configuration
   - Check allowed origins
   - Ensure proper headers

3. **Upload Failures**:
   - Check file size limits
   - Verify bucket permissions
   - Check network connectivity

**Debug Commands:**

```bash
# Check environment variables
node -e "console.log(process.env.AWS_ACCESS_KEY_ID ? '✅ AWS Key found' : '❌ AWS Key missing')"

# Test bucket access
aws s3 ls s3://your-bucket-name

# Check S3 service
node -e "const s3 = require('./services/s3Service'); s3.getBucketStats().then(console.log).catch(console.error)"
```

### **Step 7: Production Deployment**

1. **Use AWS Secrets Manager** for production credentials
2. **Enable CloudTrail** for audit logging
3. **Set up CloudWatch** for monitoring
4. **Configure CloudFront** for CDN
5. **Use AWS KMS** for encryption keys

### **Step 8: Cost Optimization**

1. **Lifecycle Policies**:
   - Move old files to cheaper storage classes
   - Delete old versions automatically

2. **Storage Classes**:
   - Standard for frequently accessed files
   - IA for infrequently accessed files
   - Glacier for long-term storage

3. **Monitoring**:
   - Set up billing alerts
   - Monitor usage patterns
   - Optimize based on access patterns

---

## 🚀 **Quick Start Commands**

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file with your AWS credentials
cp .env.example .env
# Edit .env with your actual values

# 3. Test S3 connection
npm run test:s3

# 4. Start the server
npm run dev

# 5. Test file upload
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.txt"
```

Your S3 service is already configured and ready to use! Just add your AWS credentials to the `.env` file and you'll be able to upload, download, and manage files in the cloud. 🎉
