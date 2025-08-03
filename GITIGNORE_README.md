# Gitignore Files Documentation

This project uses a comprehensive gitignore structure to ensure that sensitive files, build artifacts, and temporary files are not committed to the repository.

## Gitignore Structure

### Root Level (`.gitignore`)

The main gitignore file that covers project-wide exclusions:

- **Dependencies**: `node_modules/`, package manager logs
- **Production builds**: `build/`, `dist/`, `out/`, framework-specific builds
- **Environment variables**: All `.env` files
- **IDE/Editor files**: `.vscode/`, `.idea/`, swap files
- **OS files**: `.DS_Store`, `Thumbs.db`, etc.
- **Logs**: All log files and directories
- **Coverage/Testing**: Test results, coverage reports
- **Cache directories**: Various cache folders
- **Database files**: SQLite, database dumps
- **Upload directories**: User uploads and storage
- **SSL certificates**: Security certificates and keys
- **Backup files**: Various backup formats
- **Package manager files**: Lock files and integrity files

### Frontend (`frontend/.gitignore`)

Specific to the React frontend application:

- **React builds**: `build/` directory
- **Framework builds**: Next.js, Nuxt.js, VuePress outputs
- **Storybook**: Static storybook builds
- **Frontend-specific logs**: React development logs
- **Frontend cache**: Parcel, FuseBox caches

### Backend (`backend/.gitignore`)

Specific to the Node.js backend application:

- **Database files**: SQLite, database configurations
- **Upload storage**: File upload directories
- **SSL certificates**: Backend security certificates
- **PM2**: Process manager files
- **Sequelize**: Database configuration files
- **Backend logs**: Server and application logs

### Database (`database/.gitignore`)

Specific to database-related files:

- **Database files**: All database file formats
- **Database logs**: Database-specific logs
- **Database exports**: CSV, JSON, XML exports
- **Database backups**: Backup files and dumps
- **Database migrations**: Migration files
- **Database seeds**: Seed data files
- **Database tests**: Test SQL files

### Deployment (`deployment/.gitignore`)

Specific to deployment and infrastructure:

- **Configuration files**: Deployment configs
- **SSL certificates**: Security certificates
- **SSH keys**: SSH private and public keys
- **AWS credentials**: AWS configuration files
- **Docker files**: Local Docker configurations
- **Kubernetes secrets**: K8s secret files
- **Terraform files**: Infrastructure state files
- **Ansible files**: Automation configuration
- **PM2 files**: Process manager configuration
- **Web server configs**: Nginx, Apache configs

### Logs (`logs/.gitignore`)

Specific to log files and directories:

- **All log files**: Any file with `.log` extension
- **Log archives**: Compressed log files
- **Application logs**: App-specific log files
- **Server logs**: Web server logs
- **Database logs**: Database-specific logs
- **Node.js logs**: npm, yarn, lerna logs
- **PM2 logs**: Process manager logs
- **Docker logs**: Container logs
- **Kubernetes logs**: K8s logs
- **Log rotation**: Rotated log files
- **Log analysis**: Analysis and report files

## Security Considerations

### What's Excluded for Security

- **Environment files**: `.env` files containing secrets
- **SSL certificates**: Private keys and certificates
- **SSH keys**: Private SSH keys
- **AWS credentials**: AWS access keys and secrets
- **Database credentials**: Database connection strings
- **API keys**: Third-party service API keys
- **Deployment secrets**: Kubernetes secrets, Docker secrets

### What's Included

- **Configuration templates**: Example config files (`.env.example`)
- **Documentation**: README files and documentation
- **Source code**: All application source code
- **Schema files**: Database schemas (without sensitive data)
- **Deployment scripts**: Non-sensitive deployment scripts

## Best Practices

### Environment Variables

1. Never commit `.env` files
2. Always provide `.env.example` files
3. Document all required environment variables
4. Use different `.env` files for different environments

### Database Files

1. Never commit actual database files
2. Include schema files for version control
3. Use migrations for database changes
4. Keep database dumps out of version control

### Logs and Cache

1. Never commit log files
2. Exclude all cache directories
3. Use log rotation in production
4. Monitor log file sizes

### Build Artifacts

1. Never commit build directories
2. Build artifacts should be generated during deployment
3. Use CI/CD pipelines for builds
4. Keep build configurations in version control

## Adding New Exclusions

When adding new files or directories to gitignore:

1. **Check existing gitignores** first to avoid duplication
2. **Use specific patterns** rather than broad exclusions
3. **Document the reason** for the exclusion
4. **Test the exclusion** to ensure it works as expected
5. **Update this documentation** if needed

## Common Patterns

```bash
# Exclude all files with extension
*.log
*.tmp
*.cache

# Exclude specific directories
node_modules/
build/
logs/

# Exclude files in any directory
**/node_modules/
**/*.log

# Exclude files but keep directories
logs/*
!logs/.gitkeep

# Exclude files with specific names
.env
.DS_Store
Thumbs.db
```

## Troubleshooting

### Files Still Being Tracked

If files are still being tracked after adding to gitignore:

1. **Check if files are already tracked**: `git ls-files`
2. **Remove from tracking**: `git rm --cached <file>`
3. **Commit the removal**: `git commit -m "Remove tracked files"`
4. **Verify gitignore**: `git check-ignore <file>`

### Checking What's Ignored

To see what files are being ignored:

```bash
# Check specific file
git check-ignore <file>

# Check multiple files
git check-ignore <file1> <file2>

# Show all ignored files
git status --ignored
```

This comprehensive gitignore structure ensures that your repository remains clean, secure, and focused on source code rather than build artifacts and sensitive files.
