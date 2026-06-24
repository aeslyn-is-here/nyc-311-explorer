# NYC 311 Monitoring Dashboard

A full-stack web application that monitors NYC 311 complaints, analyzes trends, and detects spikes in complaint activity by ZIP code and complaint type.

## Features

* Search NYC 311 complaints by ZIP code
* Filter by complaint type
* View recent complaint records
* Analyze week-over-week complaint trends
* Detect complaint spikes using a configurable threshold
* Visualize complaint activity with a 14-day trend chart

## Tech Stack

### Frontend

* React
* Vite
* Axios
* Recharts

### Backend

* Node.js
* Express
* Axios

### Data Source

* NYC Open Data 311 Service Requests API

## Project Architecture

```text
React Frontend
    |
    v
Express API
    |
    v
NYC Open Data API
```

### Backend Routes

#### GET /api/complaints

Returns recent complaint records matching:

* ZIP code
* Complaint type

#### GET /api/stats

Calculates:

* Current 7-day complaint count
* Previous 7-day complaint count
* Percent change
* Spike detection metrics

#### GET /api/trend

Returns daily complaint counts for the last 14 days for chart visualization.

## Example Workflow

1. Enter a ZIP code
2. Select a complaint type
3. Search recent complaints
4. Analyze trends
5. View spike detection results
6. View 14-day trend chart

## Future Enhancements

* MongoDB alert storage
* Saved alert rules
* Slack notifications
* Scheduled monitoring jobs
* Cloud deployment
* Dashboard UI improvements

## Skills Demonstrated

* REST API development
* React state management
* Data visualization
* API integration
* Time-series analysis
* Trend detection
* Full-stack application architecture
* Git and GitHub workflow

```
```
