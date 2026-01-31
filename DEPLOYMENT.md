# Deployment Guide 🚀

Complete guide for deploying Style Discovery Hub to production.

## 📋 **Table of Contents**
1. [Docker Deployment](#docker-deployment)
2. [Manual Deployment](#manual-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Environment Variables](#environment-variables)
5. [SSL/HTTPS Setup](#sslhttps-setup)

---

## 🐳 **Docker Deployment** (Recommended)

### **Prerequisites**
- Docker 20.10+
- Docker Compose 2.0+

### **Step 1: Clone Repository**

```bash
git clone <your-repo-url>
cd style-discovery-hub
```

### **Step 2: Configure Environment**

Create `.env` file in the root directory:

```env
# Database
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=fashion_ecommerce
MYSQL_USER=fashionuser
MYSQL_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_at_least_64_characters_long_for_production

# Backend
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/fashion_ecommerce
SPRING_DATASOURCE_USERNAME=fashionuser
SPRING_DATASOURCE_PASSWORD=your_secure_password

# Frontend
VITE_API_BASE_URL=http://your-domain.com/api/v1
```

### **Step 3: Build and Run**

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### **Step 4: Initialize Database**

The database schema is automatically initialized on first run.

### **Step 5: Access Application**

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080/api/v1
- **Admin Panel**: http://localhost/admin

**Default Admin:**
- Email: admin@stylediscovery.com
- Password: admin123

### **Docker Commands**

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Rebuild specific service
docker-compose up -d --build backend

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

---

## 🖥️ **Manual Deployment**

### **Backend Deployment**

#### **1. Build JAR File**

```bash
cd backend
mvn clean package -DskipTests
```

The JAR file will be in `target/fashion-ecommerce-1.0.0.jar`

#### **2. Setup MySQL Database**

```sql
CREATE DATABASE fashion_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fashionuser'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON fashion_ecommerce.* TO 'fashionuser'@'%';
FLUSH PRIVILEGES;
```

Run the schema:
```bash
mysql -u fashionuser -p fashion_ecommerce < src/main/resources/database/schema.sql
```

#### **3. Configure Application**

Edit `application.yml` or set environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/fashion_ecommerce
export SPRING_DATASOURCE_USERNAME=fashionuser
export SPRING_DATASOURCE_PASSWORD=secure_password
export JWT_SECRET=your_jwt_secret_key
```

#### **4. Run Backend**

```bash
java -jar target/fashion-ecommerce-1.0.0.jar
```

Or with custom configuration:
```bash
java -jar target/fashion-ecommerce-1.0.0.jar \
  --spring.datasource.url=jdbc:mysql://localhost:3306/fashion_ecommerce \
  --spring.datasource.username=fashionuser \
  --spring.datasource.password=secure_password
```

#### **5. Run as Service (Linux)**

Create `/etc/systemd/system/fashion-ecommerce.service`:

```ini
[Unit]
Description=Fashion Ecommerce Backend
After=syslog.target network.target mysql.service

[Service]
User=fashionapp
ExecStart=/usr/bin/java -jar /opt/fashion-ecommerce/app.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable fashion-ecommerce
sudo systemctl start fashion-ecommerce
sudo systemctl status fashion-ecommerce
```

### **Frontend Deployment**

#### **1. Build Frontend**

```bash
npm install
npm run build
```

The build files will be in `dist/` directory.

#### **2. Deploy to Web Server**

**Using Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/fashion-ecommerce/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Using Apache:**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/fashion-ecommerce/dist

    <Directory /var/www/fashion-ecommerce/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Enable React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests
    ProxyPass /api http://localhost:8080/api
    ProxyPassReverse /api http://localhost:8080/api
</VirtualHost>
```

---

## ☁️ **Cloud Deployment**

### **AWS Deployment**

#### **Option 1: EC2 Instance**

1. Launch EC2 instance (t2.medium or larger)
2. Install Docker & Docker Compose
3. Clone repository
4. Run `docker-compose up -d`
5. Configure security groups (ports 80, 443, 8080, 3306)
6. Setup Elastic IP
7. Configure Route 53 for domain

#### **Option 2: ECS (Elastic Container Service)**

1. Push images to ECR
2. Create ECS cluster
3. Create task definitions for frontend, backend, MySQL
4. Create services
5. Setup Application Load Balancer
6. Configure Auto Scaling

#### **Option 3: Elastic Beanstalk**

```bash
# Backend
cd backend
mvn package
eb init
eb create production-env
eb deploy

# Frontend
cd ..
npm run build
# Deploy dist/ to S3 + CloudFront
```

### **Digital Ocean Deployment**

1. Create Droplet (4GB RAM minimum)
2. Install Docker
3. Clone repository
4. Run docker-compose
5. Setup domain and SSL

### **Heroku Deployment**

**Backend:**
```bash
cd backend
heroku create fashion-ecommerce-api
heroku addons:create cleardb:ignite
git push heroku main
```

**Frontend:**
```bash
npm run build
# Deploy to Netlify or Vercel
```

### **Google Cloud Platform**

- Use Cloud Run for containers
- Cloud SQL for MySQL
- Cloud Storage for file uploads
- Cloud Load Balancing

---

## 🔐 **Environment Variables**

### **Backend (.env or application.yml)**

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | MySQL connection URL | `jdbc:mysql://localhost:3306/fashion_ecommerce` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `fashionuser` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `secure_password` |
| `JWT_SECRET` | JWT signing key (64+ chars) | `your_secret_key` |
| `FILE_UPLOAD_DIR` | File upload directory | `./uploads` |
| `FILE_BASE_URL` | Base URL for files | `http://localhost:8080/api/v1/files` |

### **Frontend (.env)**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080/api/v1` |

---

## 🔒 **SSL/HTTPS Setup**

### **Using Let's Encrypt (Free)**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### **Nginx with SSL**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Your configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 **Monitoring & Maintenance**

### **Health Checks**

- Backend: `http://localhost:8080/actuator/health`
- Frontend: `http://localhost/health`
- Database: `mysql -h localhost -u root -p -e "SELECT 1"`

### **Logs**

```bash
# Docker logs
docker-compose logs -f

# System logs
journalctl -u fashion-ecommerce -f

# Application logs
tail -f backend/logs/application.log
```

### **Backups**

```bash
# Database backup
docker exec fashion-ecommerce-db mysqldump -u root -p fashion_ecommerce > backup.sql

# Restore
docker exec -i fashion-ecommerce-db mysql -u root -p fashion_ecommerce < backup.sql

# Automated backup script
0 2 * * * /path/to/backup-script.sh
```

---

## 🎯 **Performance Optimization**

1. **Enable CDN** for static assets
2. **Configure caching** (Redis/Memcached)
3. **Database indexing** and query optimization
4. **Load balancing** for high traffic
5. **Auto-scaling** based on metrics
6. **Image optimization** and lazy loading

---

## 🐛 **Troubleshooting**

**Backend won't start:**
- Check MySQL connection
- Verify Java version (21+)
- Check logs: `docker-compose logs backend`

**Frontend can't connect to backend:**
- Check `VITE_API_BASE_URL` in `.env`
- Verify CORS configuration
- Check network/firewall

**Database connection errors:**
- Verify MySQL is running
- Check credentials
- Ensure network connectivity

---

**Need help?** Check the [main README](./README.md) or open an issue.

