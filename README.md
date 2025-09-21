## LIVE URL: https://project-management-jz4o.vercel.app

# Project Management Application

A collaborative project management tool built with the MERN stack that enables teams to manage projects and tasks in real-time.

## Features

### Core Features
- **User Authentication**
  - Secure registration and login with JWT
  - Protected routes for authenticated users

- **Project Management**
  - Create, view, edit, and delete projects
  - Invite team members via in-app notifications
  - Deadline management and project status tracking

- **Task Management**
  - Create and assign tasks with priorities and due dates
  - Real-time task status updates (ToDo/InProgress/Done)
  - Permission-based task modifications

- **Real-time Collaboration**
  - Live task updates using Socket.io
  - In-app notifications for task changes
  - Project member collaboration

- **Search & Filters**
  - Search tasks/projects by keywords
  - Filter by status, priority, or assignee
  - Sort by due dates and priority

## Tech Stack

- **Frontend**: React.js with Context API for state management
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT
- **UI**: Modern responsive design with loading states and error handling

## Setup Instructions

### Prerequisites
- Node.js
- MongoDB
- npm or yarn

### Environment Variables

Create `.env` files in both frontend and backend directories:

Backend `.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:5000
```

### Installation

1. Clone the repository
2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Run the application:
```bash
# Start backend server (from backend directory)
npm start

# Start frontend development server (from frontend directory)
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:id/tasks` - Get project tasks
- `POST /api/projects/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Project Structure

```
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # Auth & Toast contexts
│   │   ├── pages/      # Main views
│   │   └── utils/      # Helper functions
│   └── index.html
```

## Security Features
- Password hashing with bcrypt
- JWT for secure authentication
- Protected API routes
- Input validation and sanitization