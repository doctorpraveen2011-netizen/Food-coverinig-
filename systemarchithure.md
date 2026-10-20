# System Architecture

## 1. High-Level Architecture
The system consists of a Frontend application and a Backend server communicating via REST APIs and WebSockets.

### Frontend
- **Framework:** React with TypeScript, built using Vite.
- **Styling:** Tailwind CSS (v3).
- **Routing:** React Router.
- **State Management:** Zustand.
- **Maps:** React-Leaflet with OpenStreetMap tiles.
- **Charts:** Recharts.

### Backend
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Real-time Communication:** Socket.io for live data pipelines.
- **AI Processing (Mocked):** Simulated AI model responses for food analysis.
- **Database (Mocked/In-Memory):** In-memory data structures simulating a persistent store.

## 2. Data Flow
1. **Client Request:** User interacts with UI (e.g., uploads an image).
2. **API Call:** Frontend sends an HTTP request to the Express backend.
3. **Processing:** Backend processes request (e.g., simulates AI analysis).
4. **Response:** Backend returns data to the frontend.
5. **Live Updates:** Backend uses Socket.io to push real-time updates (e.g., tracking coordinates, new donations) to subscribed frontend clients.
