# NYC 311 Complaint Explorer

A full-stack web application that helps New York City residents monitor 311 complaints, analyze trends, and receive automated notifications when complaint activity spikes.

Users can search recent NYC 311 complaints by ZIP code and complaint type, visualize complaint trends, create personalized alerts, and receive Slack notifications when complaint volumes exceed user-defined thresholds.

---

## Live Demo

**Frontend:** https://nyc-311-explorer.vercel.app

**Backend API:** https://nyc-311-explorer.onrender.com

---

## Features

### Public Features

- Search NYC 311 complaints by ZIP code
- Filter complaints by complaint type
- View recent complaint details
- Analyze complaint trends over time
- Interactive trend visualization
- NYC-inspired responsive user interface

### User Accounts

- User registration
- Secure login
- Persistent login sessions
- Password hashing with bcrypt
- JWT authentication
- Protected API routes

### Personalized Alerts

- Save custom alert rules
- User-specific saved alerts
- Enable or disable alerts
- Delete saved alerts
- Each user can only access their own alerts

### Automated Notifications

- Hourly background scheduler
- Detects complaint spikes automatically
- Slack notifications when thresholds are exceeded
- Duplicate notification prevention while an alert remains active

---

## Tech Stack

### Frontend

- React
- Axios
- Chart.js
- CSS

### Backend

- Node.js
- Express
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- node-cron

### Database

- MongoDB Atlas

### Cloud Deployment

- Vercel
- Render

### External APIs

- NYC Open Data API
- Slack Incoming Webhooks

---

## Architecture

```
                     React Frontend
                          (Vercel)
                              │
                    Axios HTTP Requests
                              │
                              ▼
                     Express REST API
                          (Render)
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
        MongoDB Atlas                NYC Open Data API
               │
        Users & Alert Rules
               │
               ▼
      Hourly Background Scheduler
               │
               ▼
        Slack Notifications
```

---

## Authentication

The application uses JSON Web Tokens (JWT) for authentication.

Authenticated users can:

- Save personalized alerts
- View only their own alerts
- Toggle alerts on or off
- Delete their own alerts

Public users can still:

- Search complaints
- Analyze complaint trends
- View charts

---

## Running Locally

### Clone the repository

```bash
git clone https://github.com/aeslyn-is-here/nyc-311-explorer.git
```

### Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

### Environment Variables

#### Backend (`server/.env`)

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
SLACK_WEBHOOK_URL=your_slack_webhook
NYC_311_API_URL=https://data.cityofnewyork.us/resource/erm2-nwe9.json
```

#### Frontend (`client/.env.local`)

```env
VITE_API_BASE_URL=http://localhost:5001
```

### Start the backend

```bash
cd server
npm run dev
```

### Start the frontend

```bash
cd client
npm run dev
```

Open:

```
http://localhost:5173
```

---

## Project Structure

```
client/
    Components/
    App.jsx
    App.css

server/
    models/
    routes/
    middleware/
    server.js
```

---

## What I Learned

Building this project gave me hands-on experience with:

- Designing REST APIs
- React component architecture
- State management
- MongoDB and Mongoose
- User authentication with JWT
- Password hashing with bcrypt
- Express middleware
- Background schedulers using node-cron
- Slack API integrations
- Cloud deployment with Render and Vercel
- Environment variable management
- Building a complete full-stack application from design through deployment

---

## Future Enhancements

- User-configurable Slack webhooks
- Email notifications
- Interactive map visualization
- User notification preferences
- Account settings page
- Dark mode
- Mobile-first responsive redesign
- Admin dashboard
- Analytics dashboard
- Docker deployment

---

## Why I Built This

I built NYC 311 Complaint Explorer to gain experience designing, building, and deploying a modern full-stack web application.

The project demonstrates user authentication, cloud deployment, scheduled background jobs, REST APIs, MongoDB, React, Express, and third-party integrations while solving a practical problem using New York City's Open Data platform.
