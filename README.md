# NYC 311 Complaint Explorer

A full-stack web application that allows users to explore NYC 311 complaint data, analyze neighborhood trends, and receive automated notifications when complaint activity spikes.

Built with React, Node.js, Express, MongoDB, and the NYC Open Data API.

---

## Features

### Public Features

- Search recent NYC 311 complaints by ZIP code
- Filter complaints by complaint type
- View detailed complaint records
- Analyze week-over-week complaint trends
- Interactive 14-day trend chart
- Responsive React interface

### User Features

- User registration
- Secure login using JWT authentication
- Persistent login sessions
- Save custom complaint alerts
- Activate or deactivate alerts
- Delete alerts
- Personal notification preferences

### Notifications

- Slack notifications using Incoming Webhooks
- Email notifications using Resend
- Choose between:
  - Slack
  - Email
  - Slack + Email
- Automatic background monitoring using scheduled jobs

---

## How It Works

1. Search NYC 311 complaints by ZIP code and complaint type.
2. Analyze complaint trends over the previous two weeks.
3. Save an alert with a custom percentage threshold.
4. A scheduled background process checks all active alerts.
5. When a threshold is exceeded, the application automatically sends a Slack message and/or email to the user.

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- Chart.js

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcrypt
- node-cron

### APIs

- NYC Open Data API
- Slack Incoming Webhooks
- Resend Email API

### Deployment

- Vercel (Frontend)
- Render (Backend)

---

## Project Structure

```
client/
    React frontend

server/
    Express API
    MongoDB models
    Authentication
    Scheduled alert checker
    Notification services
```

---

## Authentication

Users can:

- Register an account
- Log in securely
- Persist their session
- Save personalized alerts
- Configure notification preferences

Authentication is handled using JSON Web Tokens (JWT).

---

## Notification System

Each user can configure their preferred notification method.

Supported methods:

- None
- Slack
- Email
- Slack + Email

The alert scheduler checks active alerts on a schedule and automatically sends notifications when thresholds are exceeded.

---

## Future Improvements

- Dedicated dashboard navigation
- Separate login page
- Date range filtering
- Historical complaint analysis
- Compare two custom time periods
- Alert editing
- Alert history
- User profile page
- Map visualization
- Mobile UI improvements
- React Router navigation

---

## Screenshots

*(Coming soon)*

---

## Running Locally

### Clone the repository

```bash
git clone https://github.com/aeslyn-is-here/nyc-311-explorer.git
cd nyc-311-explorer
```

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

---

## Environment Variables

Backend (`server/.env`)

```env
MONGODB_URI=
JWT_SECRET=
NYC_OPEN_DATA_API=
RESEND_API_KEY=
```

Frontend (`client/.env`)

```env
VITE_API_BASE_URL=
```

---

## Author

**Aeslyn Vlahos**

MS Computer Science

Built as a portfolio project demonstrating:

- Full-stack web development
- REST API design
- Authentication
- MongoDB data modeling
- Background job scheduling
- Third-party API integrations
- Deployment using Vercel and Render
