# 🗓️ LeaveFlow 

A web application where **employees** can apply for leave and **employers** can approve or reject these requests.

---

Tech Stack: Vue.js + Tailwind CSS (Frontend), Node.js + Express (Backend), MongoDB Atlas (Database)

Live URL: http://13.203.58.247


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

### Bonus Features 
- JWT-based authentication
- Role-based access control (Employee vs Employer)
- Input validation on both frontend and backend
- Leave duration preview when applying
- Overlap detection for leave dates
- Pagination support on employer view

---

## Project Structure

```
leave-management/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js          
│   │   │   └── Leave.js         
│   │   ├── routes/
│   │   │   ├── auth.js          # Register, Login, Me
│   │   │   └── leaves.js        # Apply, view, approve/reject
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verify + role guard
│   │   └── server.js            # Express app entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   │   └── main.css         # Tailwind + custom components
    │   ├── components/
    │   │   └── Navbar.vue       # Top navigation bar
    │   ├── views/
    │   │   ├── Login.vue
    │   │   ├── Register.vue
    │   │   ├── ApplyLeave.vue
    │   │   ├── EmployeeDashboard.vue
    │   │   └── EmployerDashboard.vue
    │   ├── router/
    │   │   └── index.js         # Vue Router with route guards
    │   ├── store/
    │   │   └── auth.js          # Pinia auth store
    │   ├── api.js               # Axios instance with JWT interceptor
    │   ├── App.vue
    │   └── main.js
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Project Setup

### Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a cluster → choose **M0 Free Tier**
3. Create a database user with a username and password
4. Go to **Network Access** → Add IP Address → enter `0.0.0.0/0` → Confirm
5. Click **Connect** → **Drivers** → copy the connection string

---

### Step 2 — AWS EC2

1. Go to [aws.amazon.com](https://aws.amazon.com) and create a free account
2. Go to **EC2** → **Launch Instance**
   - AMI: Ubuntu 24.04 LTS
   - Instance type: t3.micro (Free Tier)
   - Key pair: Create new → download `.pem` file
   - Firewall: enable HTTP (port 80)
3. Once running → click **Connect** → **EC2 Instance Connect**

---

### Step 3 — Install on EC2

```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unzip
sudo npm install -g pm2
```

---

### Step 4 — Upload code

On your local machine:
```bash
scp -i leave-key.pem leave-management.zip ubuntu@YOUR_EC2_IP:~/
```

On EC2:
```bash
unzip leave-management.zip
```

---

### Step 5 — Backend

```bash
cd ~/leave-management/backend
npm install
nano .env
```

Add to `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leave_management?retryWrites=true&w=majority
JWT_SECRET=yoursecretkey
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://YOUR_EC2_IP
```

```bash
pm2 start src/server.js --name leave-backend
pm2 save
pm2 startup
```

---

### Step 6 — Frontend

```bash
cd ~/leave-management/frontend
npm install
echo "VITE_API_BASE_URL=http://YOUR_EC2_IP/api" > .env
npm run build
```

---

### Step 7 — Nginx

```bash
sudo nano /etc/nginx/sites-available/leave-management
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP;

    root /home/ubuntu/leave-management/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/leave-management /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

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
      │     ├── /* → Vue.js frontend (dist folder)
      │     └── /api/* → Node.js backend (port 5000)
      └── Node.js + Express (managed by PM2)
            ↓
      MongoDB Atlas (M0 Free Tier)
```
