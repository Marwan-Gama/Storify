-- Cloud File Storage System Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS cloud_storage
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cloud_storage;

-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    tier ENUM('free', 'premium') DEFAULT 'free',
    isEmailVerified BOOLEAN DEFAULT FALSE,
    emailVerificationToken VARCHAR(255),
    emailVerificationExpires DATETIME,
    passwordResetToken VARCHAR(255),
    passwordResetExpires DATETIME,
    lastLogin DATETIME,
    storageUsed BIGINT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_tier (tier),
    INDEX idx_isActive (isActive)
);

-- Folders table
CREATE TABLE folders (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    path TEXT NOT NULL,
    parentId CHAR(36),
    userId CHAR(36) NOT NULL,
    isDeleted BOOLEAN DEFAULT FALSE,
    deletedAt DATETIME,
    color VARCHAR(7),
    isPublic BOOLEAN DEFAULT FALSE,
    publicLink VARCHAR(255) UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted DATETIME,
    
    FOREIGN KEY (parentId) REFERENCES folders(id) ON DELETE SET NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_userId_parentId (userId, parentId),
    INDEX idx_path (path(255)),
    INDEX idx_publicLink (publicLink),
    INDEX idx_isDeleted (isDeleted),
    INDEX idx_deletedAt (deletedAt)
);

-- Files table
CREATE TABLE files (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    originalName VARCHAR(255) NOT NULL,
    description TEXT,
    mimeType VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    extension VARCHAR(10),
    s3Key VARCHAR(500) NOT NULL UNIQUE,
    s3Url TEXT NOT NULL,
    thumbnailUrl TEXT,
    folderId CHAR(36),
    userId CHAR(36) NOT NULL,
    isDeleted BOOLEAN DEFAULT FALSE,
    deletedAt DATETIME,
    isPublic BOOLEAN DEFAULT FALSE,
    publicLink VARCHAR(255) UNIQUE,
    downloadCount INT DEFAULT 0,
    lastAccessed DATETIME,
    tags JSON,
    metadata JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted DATETIME,
    
    FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_userId_folderId (userId, folderId),
    INDEX idx_mimeType (mimeType),
    INDEX idx_publicLink (publicLink),
    INDEX idx_s3Key (s3Key),
    INDEX idx_isDeleted (isDeleted),
    INDEX idx_deletedAt (deletedAt),
    INDEX idx_size (size),
    INDEX idx_createdAt (createdAt)
);

-- Shares table
CREATE TABLE shares (
    id CHAR(36) PRIMARY KEY,
    itemId CHAR(36) NOT NULL,
    itemType ENUM('file', 'folder') NOT NULL,
    ownerId CHAR(36) NOT NULL,
    sharedWithId CHAR(36),
    sharedWithEmail VARCHAR(255),
    permission ENUM('view', 'edit', 'download') DEFAULT 'view',
    isPublic BOOLEAN DEFAULT FALSE,
    publicLink VARCHAR(255) UNIQUE,
    expiresAt DATETIME,
    isActive BOOLEAN DEFAULT TRUE,
    accessCount INT DEFAULT 0,
    lastAccessed DATETIME,
    password VARCHAR(255),
    allowDownload BOOLEAN DEFAULT TRUE,
    allowEdit BOOLEAN DEFAULT FALSE,
    notifyOnAccess BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sharedWithId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_itemId_itemType (itemId, itemType),
    INDEX idx_ownerId (ownerId),
    INDEX idx_sharedWithId (sharedWithId),
    INDEX idx_publicLink (publicLink),
    INDEX idx_expiresAt (expiresAt),
    INDEX idx_isActive (isActive)
);

-- Create indexes for better performance
CREATE INDEX idx_files_userId_createdAt ON files(userId, createdAt);
CREATE INDEX idx_folders_userId_createdAt ON folders(userId, createdAt);
CREATE INDEX idx_shares_ownerId_createdAt ON shares(ownerId, createdAt);
CREATE INDEX idx_users_createdAt ON users(createdAt);

-- Create views for common queries
CREATE VIEW file_stats AS
SELECT 
    userId,
    COUNT(*) as totalFiles,
    SUM(size) as totalSize,
    AVG(size) as avgFileSize,
    MAX(createdAt) as lastUpload
FROM files 
WHERE isDeleted = FALSE 
GROUP BY userId;

CREATE VIEW folder_stats AS
SELECT 
    userId,
    COUNT(*) as totalFolders,
    MAX(createdAt) as lastCreated
FROM folders 
WHERE isDeleted = FALSE 
GROUP BY userId;

CREATE VIEW user_storage_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.tier,
    u.storageUsed,
    COALESCE(fs.totalFiles, 0) as totalFiles,
    COALESCE(fs.totalSize, 0) as totalFileSize,
    COALESCE(flds.totalFolders, 0) as totalFolders,
    u.createdAt as userCreatedAt
FROM users u
LEFT JOIN file_stats fs ON u.id = fs.userId
LEFT JOIN folder_stats flds ON u.id = flds.userId
WHERE u.isActive = TRUE;

-- Create stored procedures for common operations

-- Procedure to update user storage usage
DELIMITER //
CREATE PROCEDURE UpdateUserStorage(IN userId CHAR(36))
BEGIN
    UPDATE users 
    SET storageUsed = (
        SELECT COALESCE(SUM(size), 0) 
        FROM files 
        WHERE files.userId = userId AND isDeleted = FALSE
    )
    WHERE id = userId;
END //
DELIMITER ;

-- Procedure to get folder path
DELIMITER //
CREATE PROCEDURE GetFolderPath(IN folderId CHAR(36))
BEGIN
    WITH RECURSIVE folder_path AS (
        SELECT id, name, parentId, name as path, 1 as level
        FROM folders 
        WHERE id = folderId
        
        UNION ALL
        
        SELECT f.id, f.name, f.parentId, 
               CONCAT(f.name, '/', fp.path) as path, 
               fp.level + 1
        FROM folders f
        INNER JOIN folder_path fp ON f.id = fp.parentId
    )
    SELECT path FROM folder_path ORDER BY level DESC LIMIT 1;
END //
DELIMITER ;

-- Procedure to move file to trash
DELIMITER //
CREATE PROCEDURE MoveFileToTrash(IN fileId CHAR(36))
BEGIN
    UPDATE files 
    SET isDeleted = TRUE, deletedAt = NOW() 
    WHERE id = fileId;
    
    -- Update user storage
    CALL UpdateUserStorage((SELECT userId FROM files WHERE id = fileId));
END //
DELIMITER ;

-- Procedure to restore file from trash
DELIMITER //
CREATE PROCEDURE RestoreFileFromTrash(IN fileId CHAR(36))
BEGIN
    UPDATE files 
    SET isDeleted = FALSE, deletedAt = NULL 
    WHERE id = fileId;
    
    -- Update user storage
    CALL UpdateUserStorage((SELECT userId FROM files WHERE id = fileId));
END //
DELIMITER ;

-- Create triggers for automatic updates

-- Trigger to update user storage when file is inserted
DELIMITER //
CREATE TRIGGER after_file_insert
AFTER INSERT ON files
FOR EACH ROW
BEGIN
    IF NEW.isDeleted = FALSE THEN
        UPDATE users 
        SET storageUsed = storageUsed + NEW.size 
        WHERE id = NEW.userId;
    END IF;
END //
DELIMITER ;

-- Trigger to update user storage when file is updated
DELIMITER //
CREATE TRIGGER after_file_update
AFTER UPDATE ON files
FOR EACH ROW
BEGIN
    IF OLD.isDeleted = FALSE AND NEW.isDeleted = TRUE THEN
        -- File moved to trash
        UPDATE users 
        SET storageUsed = storageUsed - OLD.size 
        WHERE id = NEW.userId;
    ELSEIF OLD.isDeleted = TRUE AND NEW.isDeleted = FALSE THEN
        -- File restored from trash
        UPDATE users 
        SET storageUsed = storageUsed + NEW.size 
        WHERE id = NEW.userId;
    ELSEIF OLD.size != NEW.size AND NEW.isDeleted = FALSE THEN
        -- File size changed
        UPDATE users 
        SET storageUsed = storageUsed - OLD.size + NEW.size 
        WHERE id = NEW.userId;
    END IF;
END //
DELIMITER ;

-- Trigger to update user storage when file is deleted
DELIMITER //
CREATE TRIGGER after_file_delete
AFTER DELETE ON files
FOR EACH ROW
BEGIN
    IF OLD.isDeleted = FALSE THEN
        UPDATE users 
        SET storageUsed = storageUsed - OLD.size 
        WHERE id = OLD.userId;
    END IF;
END //
DELIMITER ;

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role, tier, isEmailVerified, isActive) 
VALUES (
    UUID(),
    'Admin User',
    'admin@cloudstorage.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS.Oi.', -- bcrypt hash of 'admin123'
    'admin',
    'premium',
    TRUE,
    TRUE
);

-- Create indexes for full-text search
CREATE FULLTEXT INDEX idx_files_name_description ON files(name, description);
CREATE FULLTEXT INDEX idx_folders_name_description ON folders(name, description);

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON cloud_storage.* TO 'clouduser'@'localhost';
-- FLUSH PRIVILEGES; 