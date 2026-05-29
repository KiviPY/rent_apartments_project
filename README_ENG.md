# 🏠 RentEasy — European Rental Platform

RentEasy is a full-stack web application for finding and listing rental properties across Europe. The platform connects property owners with prospective tenants, offering convenient search with filters, real-time chat, interactive maps, and secure two-factor authentication.

**Live Demo:** http://13.50.199.197

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API](#-api)
- [How Authentication Works](#-how-authentication-works)
- [How Chat Works](#-how-chat-works)
- [How AWS S3 Works](#-how-aws-s3-works)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)

---

## ✨ Features

- **🔐 Two-Factor Authentication** — a one-time code is sent to the user's email on every login
- **🏘️ Listings** — create, edit, and browse apartments with photos
- **🗺️ Interactive Map** — address geocoding and map pins via OpenStreetMap
- **💬 Real-Time Chat** — WebSocket messaging between tenant and landlord
- **📋 Rental System** — tenants submit requests; landlords approve or decline
- **⭐ Reviews** — only confirmed tenants can leave ratings
- **🔍 Search & Filters** — by city, price, property type, amenities, and rating
- **📱 Dark UI** — responsive design with a dark theme

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Python 3.13 + Django 5** | Core framework |
| **Django REST Framework** | REST API |
| **Daphne (ASGI)** | Async server — required for WebSocket |
| **Django Channels** | WebSocket support |
| **SimpleJWT** | JWT token authentication |
| **MySQL** | Primary database |
| **Redis** | Cache for 2FA codes + message broker for WebSocket |
| **django-storages + boto3** | AWS S3 integration for photo storage |
| **django-environ** | Environment variable management |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **React Router v6** | Client-side routing |
| **Leaflet + react-leaflet** | Interactive maps |
| **Fetch API** | HTTP requests to the backend |

### Infrastructure

| Technology | Purpose |
|---|---|
| **AWS EC2 (t3.small)** | Application server |
| **AWS S3** | Media file storage |
| **Docker + Docker Compose** | Containerization of all services |
| **Nginx** | Reverse proxy + serving frontend static files |
| **GitHub** | Version control |

---

## 🏗️ Architecture

The project is split into several independent services, each in its own Docker container:

```
User's Browser
        │
        ▼
┌─────────────────┐
│   Nginx :80     │  ← single entry point
│                 │
│  /              │──→ React SPA (static files)
│  /apartments/   │──→ Django API
│  /auth/         │──→ Django API
│  /chat/         │──→ Django API
│  /ws/           │──→ Django Channels (WebSocket)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Daphne :8000   │  ← Django ASGI server
│  (Django)       │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌───────┐  ┌───────┐
│ MySQL │  │ Redis │
│(data) │  │(cache │
│       │  │ + WS) │
└───────┘  └───┬───┘
               │
               ▼
           ┌───────┐
           │  S3   │
           │(photos│
           └───────┘
```

**Why this design?**

- **Nginx** sits in front of everything — it efficiently serves React static files and proxies API requests to Django
- **Daphne** instead of the standard Gunicorn — because Django Channels requires an ASGI server to support WebSocket connections
- **Redis** serves two distinct purposes: temporary storage for 2FA codes and message passing between WebSocket connections
- **S3** for media files — EC2 disk space is limited; S3 is cheap and effectively unlimited

---

## 📁 Project Structure

```
rent_apartments_project/
│
├── core/                        # Django project configuration
│   ├── settings/
│   │   ├── base.py              # Shared settings (INSTALLED_APPS, JWT, logging)
│   │   ├── settings_dev.py      # Dev: SQLite, console email, InMemory cache
│   │   └── settings_prod.py     # Prod: MySQL, S3, Redis, Gmail SMTP
│   ├── urls.py                  # Main URL routing
│   └── asgi.py                  # ASGI config + WebSocket routing
│
├── housing/                     # Apartment management app
│   ├── models/
│   │   ├── register_apartments.py  # Apartment model (30+ fields)
│   │   ├── images.py               # Apartment photos
│   │   ├── renting.py              # Rental requests
│   │   └── review.py               # Reviews
│   ├── serializers/             # Model-to-JSON conversion
│   ├── views/                   # API request handlers
│   ├── filters.py               # Apartment filtering and search
│   └── paginators.py            # Result pagination
│
├── users/                       # Authentication and profile
│   ├── models.py                # Custom User model (extends AbstractUser)
│   ├── serializers.py           # User serializer
│   └── views/
│       ├── user.py              # CRUD profile (/auth/me/)
│       └── user_2fa.py          # Login + 2FA code verification
│
├── chat/                        # Real-time chat
│   ├── models.py                # ChatRoom + Message
│   ├── consumers.py             # WebSocket Consumer
│   ├── routing.py               # WebSocket URL routing
│   └── views.py                 # REST API for rooms and messages
│
├── frontend/                    # React application
│   └── src/
│       ├── api.js               # All HTTP requests to the backend
│       ├── App.css              # Global styles (dark theme, CSS variables)
│       ├── context/
│       │   └── AuthContext.jsx  # Global auth state
│       └── pages/
│           ├── ApartmentList.jsx    # Main listing page
│           ├── ApartmentDetail.jsx  # Apartment detail page
│           ├── CreateApartment.jsx  # Create listing
│           ├── EditApartment.jsx    # Edit listing
│           ├── Profile.jsx          # User account
│           ├── Chat.jsx             # Chat page
│           ├── ChatList.jsx         # Chat list
│           ├── Login.jsx            # Sign in
│           └── Register.jsx         # Sign up
│
├── nginx/
│   └── nginx.conf               # Nginx configuration
│
├── Dockerfile                   # Backend image
├── docker-compose.yml           # Development
├── docker-compose.prod.yml      # Production
└── requirements.txt
```

---

## 🔌 API

### Authentication

| Method | URL | Description |
|---|---|---|
| POST | `/auth/register/` | Register a new user |
| POST | `/auth/login/` | Sign in — sends 2FA code to email |
| POST | `/auth/verify/` | Verify code — returns JWT tokens |
| GET | `/auth/me/` | Get current user data |
| PATCH | `/auth/me/` | Update profile |
| POST | `/auth/logout/` | Sign out |
| POST | `/api/token/refresh/` | Refresh access token via refresh token |

### Apartments

| Method | URL | Description |
|---|---|---|
| GET | `/apartments/` | List apartments (with filters and search) |
| POST | `/apartments/` | Create a listing |
| GET | `/apartments/:id/` | Apartment details |
| GET | `/my_apartments/` | My listings (for landlords) |
| PATCH | `/my_apartments/:id/` | Edit a listing |
| DELETE | `/my_apartments/:id/` | Delete a listing |
| POST | `/apartments/:id/images/` | Upload photo |
| DELETE | `/images/:id/` | Delete photo |

### Rentals & Reviews

| Method | URL | Description |
|---|---|---|
| POST | `/apartments/:id/bookings/` | Submit a rental request |
| GET | `/bookings/` | My requests (for tenants) |
| GET | `/owner/bookings/` | Incoming requests (for landlords) |
| PATCH | `/owner/bookings/:id/` | Approve or decline a request |
| GET | `/apartments/:id/reviews/` | Apartment reviews |
| POST | `/apartments/:id/reviews/` | Leave a review |

### Chat

| Method | URL | Description |
|---|---|---|
| GET | `/chat/rooms/` | List my chats |
| POST | `/chat/rooms/` | Create a chat with a user |
| GET | `/chat/rooms/:id/messages/` | Message history |
| DELETE | `/chat/rooms/:id/` | Delete a chat |
| WS | `/ws/chat/:id/?token=` | WebSocket connection |

---

## 🔐 How Authentication Works

JWT (JSON Web Token) is used — a standard for transmitting user information without storing sessions in a database.

### Why JWT and not sessions?

With standard Django, every request triggers a session lookup in the database — an extra DB query. JWT is self-contained: the server verifies the signature mathematically, without touching the database. This is faster and scales better. Additionally, our React frontend is separate from the backend — JWT in the `Authorization` header works more cleanly than cookies across different domains.

### Full Login Flow

```
1. User enters email + password
        │
        ▼ POST /auth/login/
   Django verifies credentials
        │
        ▼
   Generates a random 6-digit code
        │
   ┌────┴─────────────────────┐
   │                          │
   ▼                          ▼
Saves to Redis             Sends to email
cache.set("2fa:1",           via Gmail SMTP
  "483920", 300)
(expires in 5 minutes)

2. User enters the code from the email
        │
        ▼ POST /auth/verify/
   Django reads from Redis
   Compares codes
   Deletes code from Redis
        │
        ▼
   Issues two tokens:
   ┌─────────────────────────────────────┐
   │ access token  — valid for 60 min    │
   │ refresh token — valid for 7 days    │
   └─────────────────────────────────────┘
        │
        ▼
   Frontend stores:
   access  → in JS memory (lost when tab is closed)
   refresh → in localStorage (survives page reload)

3. Every API request:
   Authorization: Bearer eyJhbGci...

4. On page reload:
   Reads refresh from localStorage
   → POST /api/token/refresh/
   → Receives new access token
   → Loads user data
```

### JWT Token Structure

The token consists of three parts separated by dots:
```
eyJhbGciOiJIUzI1NiJ9  .  eyJ1c2VyX2lkIjoxfQ  .  signature
      Header                    Payload
  (algorithm)           (user_id, expiry time)
```

The signature is created with Django's `SECRET_KEY` — without it, the token cannot be forged.

---

## 💬 How Chat Works

Standard HTTP follows a request-response pattern: the client asks, the server answers. This doesn't work for chat — the server cannot push a message to the client on its own. WebSocket establishes a persistent two-way connection.

### Full Message Journey

```
User A types "Hello" → presses Enter
        │
        ▼
ws.send('{"text": "Hello"}')
        │
        ▼ Nginx /ws/ → Django Channels
        │
        ▼
Consumer.receive() — receives the message
        │
   ┌────┴──────────────────────┐
   │                           │
   ▼                           ▼
Saves to MySQL          group_send() to Redis
Message.objects           group "chat_1"
  .create(...)
                               │
                    Redis broadcasts to all in "chat_1"
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            Consumer A              Consumer B
            chat_message()          chat_message()
                    │                     │
                    ▼                     ▼
            self.send(json)         self.send(json)
                    │                     │
                    ▼                     ▼
            ws.onmessage()          ws.onmessage()
            (message at A)          (message at B)
```

### Why Redis in Chat?

If User A and User B are connected to the same Django process, messages can be passed directly. But if they are on different processes (or servers), a broker is needed. Redis acts as a shared bus: each Consumer subscribes to group `chat_1`, and Redis delivers messages to all subscribers regardless of which process they're running on.

### WebSocket Authentication

The browser cannot add an `Authorization` header to a WebSocket request — this is a browser API limitation. So the token is passed in the URL:
```
ws://host/ws/chat/1/?token=eyJhbGci...
```
A custom middleware intercepts the request, validates the token using the same methods as the REST API, and attaches the user to `scope` — the object containing connection information.

---

## ☁️ How AWS S3 Works

When a user uploads an apartment photo:

```
User selects a file
        │
        ▼
POST /apartments/:id/images/
  (file in the request body)
        │
        ▼
Django receives the file
        │
        ▼
django-storages + boto3
automatically upload to S3
        │
        ▼
The path is saved to the database:
"apartments/photo.jpg"
        │
        ▼
MEDIA_URL + path = public URL:
https://bucket.s3.region.amazonaws.com/apartments/photo.jpg
```

Files are never stored on the EC2 server — only in S3. This is important because local files are lost when Docker containers are rebuilt. S3 stores data reliably and independently of the server.

---

## 🚀 Deployment

### Requirements
- Ubuntu server with Docker and Docker Compose
- `.env.prod` file with environment variables
- GitHub repository

### First Deployment

```bash
# Connect to the server
ssh -i key.pem ubuntu@your-server-ip

# Clone the repository
git clone https://github.com/KiviPY/rent_apartments_project.git
cd rent_apartments_project

# Create the environment variables file
nano .env.prod

# Build and start all containers
sudo docker compose -f docker-compose.prod.yml up -d --build

# Apply database migrations
sudo docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Updating After Changes

```bash
# Push changes to GitHub (locally)
git add .
git commit -m "description"
git push

# On the server — pull and rebuild
git pull
sudo docker compose -f docker-compose.prod.yml down -v
sudo docker builder prune -af
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### What Happens on Startup

```
docker compose up --build
        │
   ┌────┴────────────────────────────────┐
   │    Builds 2 Docker images:          │
   │    1. Backend (Python + Django)     │
   │    2. Frontend (Node → npm build)   │
   └────┬────────────────────────────────┘
        │
   Starts 4 containers:
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ backend  │ │ frontend │ │  redis   │ │  nginx   │
   │          │ │(builds   │ │          │ │          │
   │ migrate  │ │  the app │ │          │ │  waits   │
   │ static   │ │ & exits) │ │          │ │ for all) │
   │ daphne   │ └──────────┘ └──────────┘ └──────────┘
   └──────────┘
```

The frontend container builds the React app (`npm run build`), places the files in a Docker volume, and exits — this is expected. Nginx reads those files from the volume and serves them to the browser.

---

## ⚙️ Environment Variables

Create a `.env.prod` file in the project root:

```env
# Django
DJANGO_SETTINGS_MODULE=core.settings.settings_prod
SECRET_KEY=your-secret-key-at-least-50-characters
DEBUG=False
ALLOWED_HOSTS=your-ip,your-domain.com

# MySQL Database
DATABASE_NAME=database_name
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_HOST=host
DATABASE_PORT=3306

# Redis (service name in docker-compose)
REDIS_HOST=redis

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=bucket-name
AWS_S3_REGION_NAME=eu-central-1

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=app-password
```

---

## 🔒 Security

- **JWT tokens** instead of sessions — access token lives for 60 minutes
- **2FA on every login** — one-time code sent to email
- **Passwords are hashed** by Django (PBKDF2 algorithm)
- **S3 Bucket Policy** — files are publicly readable but not writable
- **CORS** configured for the application domain only
- **Secrets in `.env.prod`** — never committed to Git
- **`.pem` keys in `.gitignore`** — SSH keys never reach the repository
- **`DEBUG=False`** in production — internal errors are not exposed to users

---

## 👨‍💻 Author

Developed by **KiviPY**