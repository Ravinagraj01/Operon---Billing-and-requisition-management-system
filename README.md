# Operon - Intelligent Requisition Pipeline Management

Operon is a full-stack web application for managing purchase requisitions and approval workflows in enterprise environments. It provides a comprehensive solution for creating, tracking, and approving purchase requests with role-based access control and real-time notifications.

## Project Overview

Operon streamlines the procurement process by allowing employees to submit purchase requisitions that flow through a multi-stage approval pipeline. Department heads, finance teams, and administrators can review, approve, or reject requests with full audit trails and SLA monitoring.

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@procura.com | admin123 |
| Finance Manager | finance@procura.com | finance123 |
| Department Head | depthead@procura.com | dept123 |
| Employee | employee@procura.com | emp123 |

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd operon/backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd operon/frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Access

- **Web Application**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **API Interactive Docs**: http://localhost:8000/redoc

## Role Capabilities

### Employee
- Create new requisitions
- View own requisitions
- Edit draft requisitions
- Submit requisitions for approval
- Add comments to requisitions
- View approval timeline

### Department Head
- All Employee capabilities
- Review and approve/reject requisitions in their department
- View all department requisitions
- Access dashboard analytics

### Finance
- All Department Head capabilities
- Review requisitions at finance review stage
- Access comprehensive analytics
- View organization-wide spend data

### Admin
- All Finance capabilities
- Review requisitions at procurement stage
- Manage users (create, edit, deactivate)
- Full system administration
- Access all analytics and reports

## Feature List

### Core Features
- **Multi-stage Approval Workflow**: Draft → Department Review → Finance Review → Procurement → Approved
- **Role-based Access Control**: Granular permissions based on user roles
- **Real-time Notifications**: Email-style notifications for actions and deadlines
- **SLA Monitoring**: 48-hour approval window with breach alerts
- **Priority Scoring**: Automatic priority calculation based on amount and category
- **Duplicate Detection**: Automatic flagging of potential duplicate requests

### User Interface
- **Modern Glassmorphism Design**: iOS-inspired translucent UI with backdrop blur effects
- **Kanban Board**: Visual pipeline management with drag-and-drop stages
- **Responsive Dashboard**: Real-time KPIs and analytics
- **Interactive Charts**: Department-wise spend analysis and compliance metrics
- **Mobile-friendly**: Fully responsive design for all screen sizes

### Advanced Features
- **Comment System**: Threaded discussions on requisitions
- **Audit Trail**: Complete history of all actions and approvals
- **Advanced Filtering**: Search and filter by stage, department, and keywords
- **Export Reports**: Download analytics reports in text format
- **User Management**: Admin panel for user administration

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Python ORM for database operations
- **SQLite**: Local database for development
- **JWT Authentication**: Secure token-based authentication
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern JavaScript library for UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Lucide React**: Modern icon library

### Database Schema
- **Users**: User accounts with roles and permissions
- **Requisitions**: Purchase requests with metadata
- **Approvals**: Approval actions and comments
- **Comments**: Discussion threads
- **Notifications**: User notifications and alerts

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Current user info

### Requisitions
- `GET /requisitions/` - List requisitions (with filters)
- `POST /requisitions/` - Create new requisition
- `GET /requisitions/{id}` - Get requisition details
- `PUT /requisitions/{id}` - Update requisition
- `DELETE /requisitions/{id}` - Delete requisition
- `POST /requisitions/{id}/submit` - Submit for approval

### Approvals
- `POST /approvals/{id}` - Approve/reject/return requisition
- `GET /approvals/{id}` - Get approval history

### Comments
- `POST /comments/{id}` - Add comment
- `GET /comments/{id}` - Get comments
- `DELETE /comments/{id}` - Delete comment

### Notifications
- `GET /notifications/` - Get user notifications
- `PUT /notifications/{id}/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

### Users (Admin only)
- `GET /users/` - List all users
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Deactivate user

## Development Notes

### Environment Variables
The application uses default configuration for development. For production:
- Change `SECRET_KEY` in `backend/auth.py`
- Update database URL in `backend/database.py`
- Configure CORS origins in `backend/main.py`

### Database Seeding
The application automatically seeds initial data on first startup:
- 4 demo users with different roles
- 6 sample requisitions in various stages
- Complete approval workflow examples

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based authorization
- SQL injection prevention
- XSS protection
- CORS configuration

## Performance Optimizations

### Frontend
- Component lazy loading
- Debounced search inputs
- Optimized re-renders with React.memo
- Efficient state management
- Image and asset optimization

### Backend
- Database query optimization
- Efficient pagination
- Response caching
- Connection pooling
- Async request handling

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in startup commands if 8000 or 5173 are occupied
2. **CORS errors**: Ensure frontend proxy is configured correctly in `vite.config.js`
3. **Database errors**: Delete `procura.db` to reset database on next startup
4. **Authentication issues**: Clear browser localStorage and login again

### Development Tips
- Use browser DevTools to inspect API requests
- Check console for detailed error messages
- Use FastAPI docs at `/docs` to test API endpoints directly
- Enable verbose logging for debugging

## Contributing

1. Follow the existing code style and patterns
2. Add proper error handling and validation
3. Include appropriate tests for new features
4. Update documentation for API changes
5. Ensure responsive design for new UI components

## License

This project is developed as a demonstration of modern full-stack development practices.

---

**Operon** - Streamlining procurement workflows with intelligent automation and modern design.
