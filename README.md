# Video Streaming Web Application

A full-stack video streaming platform built with React/TypeScript frontend, Spring Boot backend, and mediasoup SFU media server. Supports one-to-many broadcasting where one broadcaster streams video to multiple viewers.

## Architecture

```
Frontend (React) ←→ Backend (Spring Boot) ←→ Media Server (mediasoup)
      ↓                                              ↓
      └──────────── WebRTC Media (UDP) ─────────────┘
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript |
| Backend | Spring Boot 3.2 (Java 17) |
| Media Server | Node.js + mediasoup 3.13 |
| Database | H2 (development) |
| WebRTC Client | mediasoup-client 3.7 |

## Prerequisites

- **Java 17** or higher
- **Node.js 18** or higher
- **npm** or **yarn**
- **Maven 3.6+**

## Project Structure

```
videoStreaming/
├── backend/          # Spring Boot application
├── media-server/     # mediasoup Node.js server
├── frontend/         # React application
└── README.md
```

## Installation & Setup

### 1. Backend (Spring Boot)

```bash
cd backend

# Install dependencies and run
mvn spring-boot:run

# Backend will start on http://localhost:8080
```

### 2. Media Server (mediasoup)

```bash
cd media-server

# Install dependencies
npm install

# Start in development mode
npm run dev

# Media server will start on http://localhost:3000
```

### 3. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Install missing uuid package
npm install uuid

# Start development server
npm start

# Frontend will open on http://localhost:3001
```

## Running the Application

You need to run all three services simultaneously. Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend && mvn spring-boot:run
```

**Terminal 2 - Media Server:**
```bash
cd media-server && npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend && npm start
```

## Testing the Application

### Step 1: Create a Room

1. Open your browser to `http://localhost:3001`
2. Click "Create New Room"
3. Enter a room name (e.g., "Test Stream")
4. Click "Create Room"
5. You'll be taken to the broadcaster page

### Step 2: Start Broadcasting

1. Click "Start Broadcast"
2. Allow camera and microphone permissions when prompted
3. You should see your video preview
4. The broadcast is now live

### Step 3: Join as Viewer

1. Open a new browser window/tab (or use a different browser)
2. Navigate to `http://localhost:3001`
3. Find your room in the list
4. Click "Join as Viewer"
5. You should see the broadcaster's video stream

### Step 4: Test Multiple Viewers

1. Open additional browser tabs/windows
2. Join the same room as a viewer
3. All viewers should receive the video stream
4. Try closing one viewer - others should remain unaffected

## Features

- Create and manage broadcast rooms
- One broadcaster per room
- Unlimited viewers per room
- Real-time video/audio streaming
- WebRTC with SFU architecture (mediasoup)
- Automatic WebSocket reconnection
- Clean room cleanup on broadcaster disconnect

## API Endpoints

### Backend REST API (Port 8080)

- `POST /api/rooms` - Create a new room
- `GET /api/rooms` - List all active rooms
- `GET /api/rooms/{roomId}` - Get room details
- `DELETE /api/rooms/{roomId}` - Delete a room
- `GET /api/rooms/{roomId}/participants` - List participants

### Backend WebSocket

- `ws://localhost:8080/ws/signaling` - WebSocket signaling endpoint

### Media Server

- `POST http://localhost:3000/signaling` - Signaling message endpoint
- `GET http://localhost:3000/health` - Health check

## Signaling Flow

### Broadcaster Flow:
1. Join room → Get router capabilities
2. Create send transport → Connect transport
3. Produce video/audio tracks
4. Streams forwarded to viewers via SFU

### Viewer Flow:
1. Join room → Get router capabilities
2. Create receive transport → Connect transport
3. Receive notification of new producer
4. Consume video/audio tracks from producer
5. Resume consumer to start playback

## Configuration

### Backend (application.yml)
```yaml
server:
  port: 8080

media-server:
  url: http://localhost:3000
```

### Media Server (config.ts)
- RTC ports: 10000-10100 (UDP)
- Announced IP: 127.0.0.1 (development)
- Codecs: VP8, H264 (video), Opus (audio)

## Troubleshooting

### Camera/Microphone Access Denied
- Ensure you're using HTTPS in production
- Check browser permissions
- Try refreshing the page

### Connection Issues
- Verify all three services are running
- Check console logs for errors
- Ensure ports 8080, 3000, 3001, 10000-10100 are not blocked

### Video Not Showing for Viewers
- Ensure broadcaster has started streaming
- Check browser console for WebRTC errors
- Verify WebSocket connection is established

### Build Errors

**Frontend:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Backend:**
```bash
# Clean Maven build
mvn clean install
```

**Media Server:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Fully supported (recommended) |
| Firefox | ✅ Fully supported |
| Safari | ⚠️ Limited WebRTC support |
| Edge | ✅ Fully supported |

## Network Requirements

### Development (Localhost)
- All services run on localhost
- No STUN/TURN server needed
- Works without public IP

### Production
- Configure STUN server (e.g., Google's public STUN)
- Set up TURN server for NAT traversal (coturn)
- Update `ANNOUNCED_IP` environment variable in media server
- Use HTTPS for frontend (required for camera access)

## Production Deployment

### Environment Variables

**Media Server:**
```bash
export ANNOUNCED_IP=your.public.ip.address
export PORT=3000
```

**Backend:**
Update `application.yml` with production database and media server URL

### Docker Support

Docker configuration files can be added in the `docker/` directory (see implementation plan).

## Performance Tips

- Use Chrome for best performance
- Close unused tabs/applications
- Ensure good network connection
- For production, use multiple media server instances

## Limitations

- One broadcaster per room (by design)
- No recording capability (can be added)
- No screen sharing (can be added)
- No text chat (can be added)
- H2 database (in-memory) - use PostgreSQL for production

## Future Enhancements

- User authentication (JWT)
- Room passwords
- Recording capability
- Screen sharing
- Text chat
- Viewer count display
- Quality/bitrate controls
- Multi-broadcaster support (conference mode)

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Check server logs in all three terminals
4. Verify all services are running correctly
