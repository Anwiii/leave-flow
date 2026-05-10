# Leave FLow

A web application where employees can apply for leave and the employers can either approve or reject the requests.

**Tech Stack:** Vue.js + Tailwind CSS (Frontend), Node.js + Express (Backend), MongoDB Atlas (Database)

**Live URL:** http://16.16.186.125/

---
## Features

### Employee
- Sign up / Log in
- Apply for leave (type, start date, end date, reason)
- View all own leave requests with status (Pending / Approved / Rejected)
- Overlap detection — cannot apply for duplicate date ranges
- Dashboard stats (total, pending, approved, rejected)

### Employer
- Sign up / Log in
- View all employee leave requests (with filter by status)
- Approve or Reject requests with an optional review note
- Dashboard stats overview

---

## Project Setup

### 1. MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a cluster -> M0 Free Tier
3. Create a database user with a username and password
4. Network Access → Add IP Address → enter `0.0.0.0/0`
5. Connect → Drivers → copy the connection string


### 2. AWS EC2

1. Go to [aws.amazon.com](https://aws.amazon.com) 
2. Go to EC2 and Launch Instance
   - AMI: Ubuntu 24.04 LTS
   - Instance type: t3.micro 
   - Key pair: Create new → download `.pem` file
   - Firewall: enable HTTP 
3. Once running → connect to EC2 instance


### Step 3 — Install requirements onto EC2

```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unzip
sudo npm install -g pm2
```


### Step 4 — Upload and run the code

- Upload the project zip file to EC2 and then unzip it
- backend folder -> create a .env file for environment variables with MongoDB URI and JWT secret.
- Run npm install and start with PM2.
- frontend folder -> run npm install and npm run build.
- Configure Nginx to serve the frontend and proxy API requests to the backend.
- Access the app at http://16.16.186.125/

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register as employee or employer |
| POST | /api/auth/login | Login and receive JWT token |
| GET | /api/auth/me | Get current logged in user |

### Leaves
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/leaves | Employee | Apply for leave |
| GET | /api/leaves/my | Employee | View own leave requests |
| GET | /api/leaves | Employer | View all leave requests |
| PATCH | /api/leaves/:id/review | Employer | Approve or reject a leave |
| GET | /api/leaves/stats | Employer | Get counts by status |

---

## Deployment Topology

```
User's Browser
      ↓
AWS EC2 (Ubuntu 24.04, t3.micro)
      ├── Nginx (port 80)
      │     ├── /* → Vue.js frontend
      │     └── /api/* → Node.js backend (port 5000)
      └── Node.js + Express (managed by PM2)
            ↓
      MongoDB Atlas
```
