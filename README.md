# Lunge Workout App

## Overview
The Lunge Workout App is a full-stack fitness tracking application that enables users to log their workouts and track progress. The system consists of three main components:

- **Backend (Node.js, Express, MySQL, AWS S3)** - Handles API requests, authentication, and workout data storage.
- **Admin Dashboard (React.js)** - Provides administrators with tools to manage user workouts.
- **iOS App (Swift, SwiftUI)** - A mobile app for users to log workouts and track progress.

## Deployment
### **Backend**
✅ **Deployed on Railway** - No local setup required.

- **Base API URL:** `https://lunge-workout-backend-production.up.railway.app`

## Running the Admin Dashboard Locally
The Admin Dashboard is a **React.js** app for managing workouts.

### **Setup Instructions**
1. **Clone the repository**  
   ```sh
   git clone https://github.com/tish978/lunge-frontend-dashboard.git
   cd lunge-frontend-dashboard
   ```

2. **Install dependencies**  
   ```sh
   npm install
   ```

3. **Start the React app**  
   ```sh
   npm start
   ```

### **Accessing the Dashboard**
- Open your browser and navigate to:
  🔗 **http://localhost:3000**
- The **Admin Login Page** should appear automatically.

### **Admin Dashboard API Connection**
- The `.env` file **already contains the correct backend URL** (`REACT_APP_BACKEND_URL`).
- No changes are needed to configure the API.

---

## Running the iOS App Locally
The **Lunge Workout iOS App** is built with **SwiftUI** and interacts with the backend.

### **Setup Instructions**
1. **Clone the repository**  
   ```sh
   git clone https://github.com/tish978/lunge-frontend-ios.git
   cd lunge-frontend-ios
   ```

2. **Open in Xcode**  
   ```sh
   open LungeWorkout.xcodeproj
   ```

3. **Run the App**  
   - Select a simulator or connect a physical device.
   - Click ▶️ **Run** in Xcode.

### **API Connection**
- The **base API URL is already configured** via `AppConfig.swift`.
- No manual setup is needed.

---

## Testing the App
### **User Authentication**
- Admins can log in via the **Admin Dashboard**.
- Users can log in and track workouts via the **iOS app**.
- NOTE: For both Admin Dashboard and iOS App please use the credentials below:
- Email/Username: satish.bisa@gmail.com
- Password: password123

### **Testing with the Deployed Backend**
- Try creating and deleting workouts in the **Admin Dashboard**.
- Test logging workouts in the **iOS app**.

---

## Submission Details
✅ **GitHub Repositories:**
- Backend: [https://github.com/tish978/lunge-workout-backend](https://github.com/tish978/lunge-workout-backend)
- Admin Dashboard: [https://github.com/tish978/lunge-frontend-dashboard](https://github.com/tish978/lunge-frontend-dashboard)
- iOS App: [https://github.com/tish978/lunge-frontend-ios](https://github.com/tish978/lunge-frontend-ios)

✅ **Deployed API:** [https://lunge-workout-backend-production.up.railway.app](https://lunge-workout-backend-production.up.railway.app)
