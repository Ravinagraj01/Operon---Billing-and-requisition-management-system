# Operon - Complete Functionality Guide for Demo & Interview Preparation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Backend API Endpoints](#backend-api-endpoints)
6. [Frontend Pages & Components](#frontend-pages--components)
7. [Approval Workflow](#approval-workflow)
8. [AI Assistant Feature](#ai-assistant-feature)
9. [Role-Based Access Control](#role-based-access-control)
10. [Key Interview Questions & Answers](#key-interview-questions--answers)

---

## Project Overview

**Operon** is a full-stack web application for managing purchase requisitions and approval workflows in enterprise environments. It streamlines procurement by allowing employees to submit purchase requests that flow through a multi-stage approval pipeline.

### Key Features
- Multi-stage approval workflow (Draft → Dept Review → Finance Review → Procurement → Approved/Rejected)
- Role-based access control (Employee, Department Head, Finance, Admin)
- AI-powered requisition form filling using natural language
- Real-time notifications system
- SLA monitoring (48-hour approval window)
- Duplicate detection for requests
- Comprehensive analytics and reporting
- Modern glassmorphism UI design

### Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@procura.com | admin123 |
| Finance Manager | finance@procura.com | finance123 |
| Department Head | depthead@procura.com | dept123 |
| Employee | employee@procura.com | emp123 |

---

## Architecture & Technology Stack

### Backend (Python/FastAPI)
- **FastAPI**: Modern Python web framework for building APIs
- **SQLAlchemy**: Python ORM for database operations
- **SQLite**: Local database (development)
- **JWT Authentication**: Token-based authentication using jose library
- **Pydantic**: Data validation and serialization
- **bcrypt**: Password hashing
- **Groq API**: AI assistant integration (Llama 3 70B model)

### Frontend (React)
- **React 18**: UI library with hooks
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library
- **Context API**: State management (Auth, Theme)

### Database Models
- **Users**: User accounts with roles and permissions
- **Requisitions**: Purchase requests with metadata
- **Approvals**: Approval actions and comments
- **Comments**: Discussion threads on requisitions
- **Notifications**: User notifications and alerts

---

## Database Schema

### User Model
```python
- id (Integer, Primary Key)
- full_name (String)
- email (String, Unique)
- hashed_password (String)
- role (String): "employee", "dept_head", "finance", "admin"
- department (String, Optional)
- is_active (Boolean, Default: True)
- created_at (DateTime, Server Default)
```

**Relationships:**
- One-to-many with Requisitions (creator)
- One-to-many with Comments
- One-to-many with Notifications
- One-to-many with Approvals (approver)

### Requisition Model
```python
- id (Integer, Primary Key)
- req_id (String, Unique, Auto-generated: REQ-XXXX)
- title (String)
- description (Text, Optional)
- category (String): IT, HR, Finance, Legal, Operations, Marketing, Security, Other
- vendor_suggestion (String, Optional)
- amount (Float)
- department (String)
- priority_score (Integer, Default: 5)
- stage (String, Default: "dept_review"): draft, dept_review, finance_review, procurement, approved, rejected
- is_duplicate_flag (Boolean, Default: False)
- created_by_id (Integer, Foreign Key → users.id)
- created_at (DateTime, Server Default)
- updated_at (DateTime, Auto-update)
- sla_deadline (DateTime, Optional)
```

**Relationships:**
- Many-to-one with User (creator)
- One-to-many with Comments
- One-to-many with Approvals

### Approval Model
```python
- id (Integer, Primary Key)
- requisition_id (Integer, Foreign Key → requisitions.id)
- approver_id (Integer, Foreign Key → users.id)
- stage (String): Which stage this approval belongs to
- action (String): "approved", "rejected", "returned"
- comment (Text, Optional)
- acted_at (DateTime, Server Default)
```

### Comment Model
```python
- id (Integer, Primary Key)
- requisition_id (Integer, Foreign Key → requisitions.id)
- user_id (Integer, Foreign Key → users.id)
- message (Text)
- created_at (DateTime, Server Default)
```

### Notification Model
```python
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key → users.id)
- message (String)
- is_read (Boolean, Default: False)
- created_at (DateTime, Server Default)
- requisition_id (Integer, Foreign Key → requisitions.id, Optional)
```

---

## Authentication & Authorization

### Authentication Flow

1. **User Login** (`POST /auth/login`)
   - User submits email and password
   - Server verifies credentials using bcrypt
   - If valid, generates JWT token (expires in 480 minutes)
   - Token stored in localStorage as `procura_token`
   - User data fetched from `/auth/me` and stored as `procura_user`

2. **Token Validation**
   - Axios interceptor attaches token to every request as `Bearer {token}`
   - Backend validates token using JWT decode
   - If token invalid/expired, user redirected to login

3. **User Registration** (`POST /auth/register`)
   - Creates new user with hashed password
   - Returns JWT token immediately
   - Auto-logs user in

### Authorization System

**Role Hierarchy (Lowest to Highest):**
1. Employee
2. Department Head (Dept Head)
3. Finance
4. Admin

**Role-Based Permissions:**

| Feature | Employee | Dept Head | Finance | Admin |
|---------|----------|-----------|---------|-------|
| Create requisitions | ✅ | ✅ | ✅ | ✅ |
| View own requisitions | ✅ | ✅ | ✅ | ✅ |
| Edit draft requisitions | ✅ | ✅ | ✅ | ✅ |
| Delete draft requisitions | ✅ | ✅ | ✅ | ✅ |
| Approve dept_review | ❌ | ✅ (own dept) | ❌ | ❌ |
| Approve finance_review | ❌ | ❌ | ✅ | ❌ |
| Approve procurement | ❌ | ❌ | ❌ | ✅ |
| View all requisitions | ❌ | Own dept only | Finance review + acted | All |
| Access dashboard | ✅ | ✅ | ✅ | ✅ |
| Access analytics | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

**Authorization Helpers** (`backend/auth.py`):
- `require_admin(user)`: Raises 403 if not admin
- `require_finance_or_admin(user)`: Raises 403 if not finance or admin
- `require_dept_head_or_above(user)`: Raises 403 if not dept_head, finance, or admin

**Frontend Route Protection** (`ProtectedRoute.jsx`):
- Checks if user is authenticated
- Optionally checks if user has required role
- Redirects to login if not authenticated
- Shows access denied if role insufficient

---

## Backend API Endpoints

### Authentication Endpoints (`/auth`)

#### POST `/auth/register`
- **Purpose**: Register a new user
- **Request Body**: `{ full_name, email, password, role, department }`
- **Response**: `{ access_token, token_type }`
- **Validation**: Email must be unique

#### POST `/auth/login`
- **Purpose**: Authenticate user and get token
- **Request Body**: Form data with `username` (email) and `password`
- **Response**: `{ access_token, token_type }`
- **Validation**: Checks password with bcrypt, verifies user is active

#### GET `/auth/me`
- **Purpose**: Get current user info
- **Headers**: `Authorization: Bearer {token}`
- **Response**: User object (id, full_name, email, role, department, is_active, created_at)
- **Protection**: Requires valid JWT token

### Requisition Endpoints (`/requisitions`)

#### POST `/requisitions/`
- **Purpose**: Create a new requisition
- **Request Body**: `{ title, description, category, vendor_suggestion, amount, department }`
- **Response**: Requisition object with creator info
- **Logic**:
  - Generates unique `req_id` (REQ-XXXX format)
  - Checks for duplicates (same category + department within 30 days)
  - Sets stage to `dept_review` automatically
  - Creates notifications for all dept_head users in the department
  - Sets SLA deadline to 48 hours from creation

#### GET `/requisitions/`
- **Purpose**: List requisitions with filters
- **Query Params**: `stage`, `department`, `search`
- **Response**: Array of requisitions
- **Role-Based Filtering**:
  - Employee: Only own requisitions
  - Dept Head: Only department requisitions
  - Finance: Finance review stage + previously acted requisitions
  - Admin: All requisitions

#### GET `/requisitions/{req_id}`
- **Purpose**: Get detailed requisition info
- **Response**: Requisition with comments and approvals
- **Note**: Accepts both `req_id` (string) and `id` (integer)

#### PUT `/requisitions/{req_id}`
- **Purpose**: Update requisition
- **Request Body**: Partial update of fields
- **Restrictions**:
  - Only creator can edit
  - Only allowed if stage is `draft`
- **Response**: Updated requisition

#### DELETE `/requisitions/{req_id}`
- **Purpose**: Delete requisition
- **Restrictions**:
  - Only creator can delete
  - Only allowed if stage is `draft`
- **Response**: Success message

#### POST `/requisitions/{req_id}/submit`
- **Purpose**: Submit draft requisition for approval
- **Restrictions**:
  - Only creator can submit
  - Only allowed if stage is `draft`
- **Logic**:
  - Updates stage to `dept_review`
  - Sets SLA deadline to 48 hours
  - Notifies all dept_head users in department

### Approval Endpoints (`/approvals`)

#### POST `/approvals/{requisition_id}`
- **Purpose**: Approve/reject/return requisition
- **Request Body**: `{ action, comment }`
- **Actions**: `approved`, `rejected`, `returned`
- **Logic**:
  - Validates user role matches current stage requirement
  - Creates Approval record
  - Updates requisition stage based on action:
    - `approved`: Moves to next stage (or "approved" if final)
    - `rejected`: Sets stage to "rejected"
  - Sends notifications:
    - On approve: Notify next stage approvers or creator if final
    - On reject: Notify creator with reason
- **Stage Progression**:
  - dept_review → finance_review → procurement → approved

#### GET `/approvals/{requisition_id}`
- **Purpose**: Get approval history for requisition
- **Response**: Array of approvals with approver info
- **Order**: Chronological (oldest first)

### User Management Endpoints (`/users`)

#### GET `/users/`
- **Purpose**: List all users
- **Protection**: Admin only
- **Response**: Array of all users

#### GET `/users/{user_id}`
- **Purpose**: Get specific user
- **Protection**: Admin or own profile
- **Response**: User object

#### PUT `/users/{user_id}`
- **Purpose**: Update user
- **Request Body**: `{ full_name, role, department, is_active }`
- **Protection**: Admin only
- **Response**: Updated user

#### DELETE `/users/{user_id}`
- **Purpose**: Deactivate user (soft delete)
- **Protection**: Admin only
- **Logic**: Sets `is_active = False`
- **Response**: Success message

### Dashboard Endpoints (`/dashboard`)

#### GET `/dashboard/stats`
- **Purpose**: Get dashboard statistics
- **Response**: 
```json
{
  "total_requisitions": int,
  "pipeline_value": float,
  "pending_approvals": int,
  "approved_value": float,
  "avg_approval_time_hours": float,
  "spend_by_department": { "dept": amount },
  "stage_counts": { "stage": count },
  "sla_breached": int,
  "latest_requisition": { ... }
}
```
- **Role-Based Calculation**:
  - Employee: Only own requisitions
  - Dept Head: Only department requisitions
  - Finance: Finance review + acted requisitions
  - Admin: All requisitions

### Notification Endpoints (`/notifications`)

#### GET `/notifications/`
- **Purpose**: Get user notifications
- **Query Params**: `unread_only` (boolean)
- **Response**: Array of notifications (user's own)
- **Order**: Newest first

#### PUT `/notifications/{notification_id}/read`
- **Purpose**: Mark notification as read
- **Response**: Updated notification

#### PUT `/notifications/read-all`
- **Purpose**: Mark all notifications as read
- **Response**: Success message with count

### AI Assistant Endpoints (`/ai`)

#### POST `/ai/assistant/requisition`
- **Purpose**: Convert natural language to structured requisition
- **Request Body**: `{ text }` (5-1000 characters)
- **Response**:
```json
{
  "title": string,
  "category": string,
  "amount": number | null,
  "vendor_suggestion": string | null,
  "description": string,
  "confidence": "high" | "medium" | "low",
  "clarification_needed": string | null
}
```
- **Technology**: Groq API with Llama 3 70B model
- **Features**:
  - Extracts title, category, amount, vendor, description
  - Provides confidence level
  - Suggests clarification if needed
  - Validates category against allowed values

---

## Frontend Pages & Components

### 1. Login Page (`pages/Login.jsx`)

**Purpose**: User authentication entry point

**Features**:
- Email and password form
- Demo credential buttons for quick testing
- Theme toggle (dark/light mode)
- Error handling with toast notifications
- Loading state during authentication

**Key Functions**:
- `handleSubmit()`: Calls AuthContext login, redirects to dashboard on success
- `fillDemoCredentials()`: Pre-fills form with demo credentials

**Interview Talking Points**:
- Implements OAuth2PasswordRequestForm format for FastAPI compatibility
- Stores JWT token in localStorage for persistence
- Uses React Router for navigation
- Glassmorphism design with gradient background

### 2. Dashboard Page (`pages/Dashboard_Working.jsx`)

**Purpose**: Main overview with role-based statistics

**Features**:
- Role-specific statistics calculation
- KPI cards (Total Requisitions, Pipeline Value, Pending Approvals, Approved Value)
- Stage distribution breakdown
- Department spend analysis
- Approved requests list (top 5)
- Pending tasks list (top 5)
- Dark/light mode support

**Role-Based Display**:
- **Employee**: Shows own requisitions only
- **Dept Head**: Shows department requisitions only
- **Finance**: Shows finance review + acted requisitions
- **Admin**: Shows all requisitions

**Key Functions**:
- `calculateFilteredStats()`: Filters data based on user role
- `fetchStats()`: Gets dashboard statistics from API
- `fetchRequisitions()`: Gets requisition list for detailed views

**Interview Talking Points**:
- Implements client-side filtering for role-based views
- Uses Intl.NumberFormat for Indian Rupee formatting
- Responsive grid layout with Tailwind CSS
- Real-time data fetching with useEffect hooks

### 3. New Requisition Page (`pages/NewRequisition.jsx`)

**Purpose**: Create new purchase requisitions

**Features**:
- Manual form filling with validation
- AI assistant integration for auto-filling
- Live preview of requisition card
- SLA information display
- Department pre-filled from user profile (read-only for employees)

**Form Fields**:
- Title (required)
- Description (optional)
- Category (required): IT, HR, Finance, Legal, Operations, Marketing, Security, Other
- Vendor Suggestion (optional)
- Amount in INR (required)
- Department (required, auto-filled)

**Key Functions**:
- `validateForm()`: Client-side validation before submission
- `handleSubmit()`: Creates requisition via API, redirects to pipeline
- `handleAIFill()`: Applies AI-extracted data to form

**Interview Talking Points**:
- Form validation with error states
- Real-time preview using RequisitionCard component
- SLA deadline calculation (48 hours from submission)
- Category dropdown with predefined options

### 4. Pipeline Page (`pages/Pipeline_Working.jsx`)

**Purpose**: Kanban board view of requisitions by stage

**Features**:
- Visual Kanban board with 5 columns (Dept Review, Finance Review, Procurement, Approved, Rejected)
- Search by title or requisition ID
- Filter by department
- Stage counts and statistics
- SLA status display (days left or breached)
- Duplicate flag indicator
- Click to view requisition details

**Stages**:
- Dept Review (👤): Awaiting department head approval
- Finance Review (💰): Awaiting finance validation
- Procurement (🧾): Awaiting admin procurement approval
- Approved (✅): Fully approved
- Rejected (❌): Request rejected

**Key Functions**:
- `fetchRequisitions()`: Gets requisitions with role-based filtering
- `getSlaStatus()`: Calculates SLA status (days left or breached)
- Filter logic for search and department

**Interview Talking Points**:
- Implements Kanban-style UI with drag-free columns
- Role-based filtering applied to pipeline view
- SLA breach detection with visual indicators
- Responsive grid layout for columns

### 5. Requisition Detail Page (`pages/RequisitionDetail.jsx`)

**Purpose**: Detailed view of single requisition with actions

**Features**:
- Full requisition information display
- Approval timeline visualization
- Comments/discussion thread
- Approval/reject actions with comments
- Edit and delete (for draft stage only)
- SLA deadline display with breach warning
- Duplicate flag warning

**Tabs**:
- **Timeline**: Shows approval history with ApprovalTimeline component
- **Comments**: Discussion thread with add comment form

**Actions** (Role-Based):
- **Approve**: Available if user role matches current stage
- **Reject**: Available if user role matches current stage (requires comment)
- **Edit**: Available only to creator in draft stage
- **Delete**: Available only to creator in draft stage

**Key Functions**:
- `handleApproval()`: Submits approval action with comment
- `handleAddComment()`: Adds comment to requisition
- `handleDelete()`: Deletes requisition (draft only)

**Interview Talking Points**:
- Conditional rendering based on user role and requisition stage
- Approval timeline shows complete audit trail
- Comment system for collaboration
- SLA breach visual warning

### 6. Analytics Page (`pages/Analytics.jsx`)

**Purpose**: Comprehensive analytics and reporting

**Features**:
- This month approved value
- This month requisition count
- Average approval time
- Top 3 departments by spend
- Top 3 categories by value
- Weekly requisition chart (last 4 weeks)
- SLA compliance rate (circular progress)
- Export report to text file

**Role-Based Access**:
- Employee: Not accessible (redirected)
- Dept Head: Department-level analytics
- Finance: Organization-wide analytics
- Admin: Organization-wide analytics

**Key Functions**:
- `generateReport()`: Creates downloadable text report
- Weekly data calculation for chart
- Category and department aggregation

**Interview Talking Points**:
- Client-side data aggregation for charts
- Custom circular progress for SLA compliance
- Report generation with Blob API
- Role-based data filtering

### 7. Users Page (`pages/Users.jsx`)

**Purpose**: Admin-only user management

**Features**:
- User list with search
- Inline edit for role and department
- Deactivate user (soft delete)
- Role badges with color coding
- Status indicators (Active/Inactive)
- Summary statistics (Total, Active, Admins, Employees)

**Actions**:
- **Edit**: Update role and department
- **Deactivate**: Soft delete (sets is_active = false)

**Key Functions**:
- `handleEdit()`: Opens inline edit form
- `handleSaveEdit()`: Updates user via API
- `handleDeactivate()`: Deactivates user with confirmation

**Interview Talking Points**:
- Inline editing pattern for better UX
- Soft delete pattern (is_active flag)
- Search filtering with debounce
- Role-based access control (admin only)

### 8. AI Assistant Component (`components/requisitions/AIAssistant.jsx`)

**Purpose**: AI-powered form filling using natural language

**Features**:
- Natural language input (5-1000 characters)
- Example prompts for quick testing
- Confidence level indicator (High/Medium/Low)
- Clarification suggestions
- Extracted fields display
- Apply to form button
- Error handling with retry

**Extracted Fields**:
- Title (highlighted)
- Category
- Estimated Amount
- Vendor Suggestion
- Description

**Key Functions**:
- `handleSubmit()`: Calls AI API with user input
- `handleApply()`: Fills form with extracted data
- `handleReset()`: Clears state for new attempt

**Interview Talking Points**:
- Uses Groq API with Llama 3 70B model
- Few-shot prompting for consistent output
- JSON extraction and validation
- Confidence scoring for reliability
- Auto-scroll to form after apply

### 9. Approval Timeline Component (`components/approvals/ApprovalTimeline.jsx`)

**Purpose**: Visual timeline of approval stages

**Features**:
- Vertical timeline with stage indicators
- Status icons (Check, X, Clock)
- Approver information
- Approval comments
- Timestamps for each stage
- Active stage highlighting with pulse animation

**Stage Status**:
- **Completed**: Green checkmark
- **Rejected**: Red X
- **Returned**: Orange X
- **Active**: Blue clock with pulse
- **Pending**: Gray dot

**Interview Talking Points**:
- Visual audit trail for compliance
- Dynamic status calculation
- Responsive timeline layout
- Animation for active stage

### 10. AuthContext (`context/AuthContext.jsx`)

**Purpose**: Global authentication state management

**Features**:
- User state management
- Token storage and validation
- Login/logout/register functions
- Auto-logout on token expiry
- Loading state during initialization

**Key Functions**:
- `login()`: Authenticates user, stores token and user data
- `logout()`: Clears storage, redirects to login
- `register()`: Creates user, auto-authenticates
- Token validation on app load via `/auth/me`

**Interview Talking Points**:
- React Context for global state
- JWT token in localStorage
- Axios interceptor for automatic token attachment
- Auto-redirect on 401 errors

---

## Approval Workflow

### Workflow Stages

```
Draft → Dept Review → Finance Review → Procurement → Approved
                ↓
            Rejected
```

### Stage Details

#### 1. Draft Stage
- **Creator**: Employee (any role)
- **Actions**: Edit, Delete, Submit
- **Visibility**: Only creator
- **Next Stage**: Dept Review (on submit)

#### 2. Dept Review Stage
- **Approver**: Department Head (same department)
- **Actions**: Approve, Reject (with comment)
- **SLA**: 48 hours from submission
- **Next Stage**: 
  - Approve → Finance Review
  - Reject → Rejected

#### 3. Finance Review Stage
- **Approver**: Finance role
- **Actions**: Approve, Reject (with comment)
- **SLA**: 48 hours from previous approval
- **Next Stage**:
  - Approve → Procurement
  - Reject → Rejected

#### 4. Procurement Stage
- **Approver**: Admin role
- **Actions**: Approve, Reject (with comment)
- **SLA**: 48 hours from previous approval
- **Next Stage**:
  - Approve → Approved
  - Reject → Rejected

#### 5. Approved Stage
- **Status**: Final approved state
- **Actions**: None (read-only)
- **Notification**: Creator notified of approval

#### 6. Rejected Stage
- **Status**: Rejected at any stage
- **Actions**: None (read-only)
- **Notification**: Creator notified with reason

### SLA Monitoring

- **SLA Window**: 48 hours per stage
- **Calculation**: From stage entry time
- **Breach Detection**: `sla_deadline < current_time`
- **Display**: Days left or "BREACHED by X days"
- **Dashboard**: SLA breached count in statistics

### Notification System

**Triggers**:
1. Requisition submitted → Notify dept_head users in department
2. Requisition approved → Notify next stage approvers or creator (if final)
3. Requisition rejected → Notify creator with reason
4. Comment added → (Future: Notify relevant parties)

**Notification Types**:
- New requisition awaiting review
- Requisition requires your approval
- Requisition approved
- Requisition rejected with reason

---

## AI Assistant Feature

### Technology Stack
- **API**: Groq API (https://api.groq.com/openai/v1)
- **Model**: Llama 3 70B (llama3-70b-8192)
- **Library**: OpenAI Python SDK (compatible with Groq)

### Implementation Details

#### Backend (`services/ai_assistant.py`)

**System Prompt**:
- Defines role as procurement assistant
- Specifies output format (JSON only)
- Lists valid categories
- Sets rules for extraction

**Few-Shot Examples**:
- Provides 3 examples of input → output pairs
- Ensures consistent formatting
- Handles edge cases (vague input, missing amounts)

**Validation**:
- Category validation against allowed values
- Amount sanitization (positive numbers only)
- Title length limit (80 characters)
- Confidence level enforcement

#### Frontend (`components/requisitions/AIAssistant.jsx`)

**User Experience**:
- Collapsible panel to save space
- Example prompts for quick testing
- Character counter (max 1000)
- Confidence badge (High/Medium/Low)
- Clarification warning if needed
- Apply button with auto-scroll

**Error Handling**:
- Network errors with retry option
- Invalid JSON handling
- Empty response handling
- User-friendly error messages

### Use Cases

**Example 1: Complete Input**
```
Input: "i need new laptops for 3 developers joining next month, around 80k each, prefer dell"
Output:
{
  "title": "Dell Laptop Procurement — Developer Onboarding Batch (3 Units)",
  "category": "IT",
  "amount": 240000,
  "vendor_suggestion": "Dell India",
  "description": "Procurement of 3 Dell laptops required for new developer hires...",
  "confidence": "high",
  "clarification_needed": null
}
```

**Example 2: Missing Amount**
```
Input: "we need to hire a legal consultant for reviewing our vendor contracts"
Output:
{
  "title": "Legal Consultation Services — Vendor Contract Review",
  "category": "Legal",
  "amount": null,
  "vendor_suggestion": null,
  "description": "Engagement of an external legal consultant...",
  "confidence": "medium",
  "clarification_needed": "What is the estimated budget or expected number of hours?"
}
```

**Example 3: Vague Input**
```
Input: "need stuff for the office"
Output:
{
  "title": "Office Supplies Procurement",
  "category": "Operations",
  "amount": null,
  "vendor_suggestion": null,
  "description": "Procurement of general office supplies...",
  "confidence": "low",
  "clarification_needed": "Could you specify what office supplies are needed, the quantity, and an estimated budget?"
}
```

### Interview Talking Points

- **Why Groq?**: Fast inference, low latency, cost-effective
- **Why Llama 3?**: Open-source, strong performance, good for structured output
- **Few-shot learning**: Improves consistency and accuracy
- **JSON validation**: Ensures frontend compatibility
- **Confidence scoring**: Helps users know when to review carefully
- **Clarification requests**: Reduces back-and-forth

---

## Role-Based Access Control

### Permission Matrix

| Action | Employee | Dept Head | Finance | Admin |
|--------|----------|-----------|---------|-------|
| Create requisition | ✅ | ✅ | ✅ | ✅ |
| View own requisitions | ✅ | ✅ | ✅ | ✅ |
| View all requisitions | ❌ | Own dept only | Finance review + acted | ✅ |
| Edit draft requisition | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| Delete draft requisition | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) |
| Approve dept_review | ❌ | ✅ (own dept) | ❌ | ❌ |
| Approve finance_review | ❌ | ❌ | ✅ | ❌ |
| Approve procurement | ❌ | ❌ | ❌ | ✅ |
| Add comments | ✅ | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Export reports | ❌ | ✅ | ✅ | ✅ |

### Implementation

**Backend**:
- Role check decorators in `auth.py`
- Role-based filtering in router endpoints
- Stage-role mapping in approvals router

**Frontend**:
- ProtectedRoute component for route-level protection
- Conditional rendering based on user role
- Role-based data filtering in dashboard

### Security Considerations

- Passwords hashed with bcrypt
- JWT tokens with expiration
- Role checks on both backend and frontend
- Soft delete for users (is_active flag)
- SQL injection prevention via ORM

---

## Key Interview Questions & Answers

### Architecture & Design

**Q: Why did you choose FastAPI over Flask or Django?**
A: FastAPI provides automatic API documentation with Swagger UI, built-in data validation with Pydantic, async support for better performance, and type hints for better IDE support. It's modern and designed for building APIs quickly.

**Q: Why SQLite instead of PostgreSQL/MySQL?**
A: SQLite was chosen for development simplicity - it's file-based, requires no setup, and is perfect for a demo application. For production, it can be easily switched to PostgreSQL by changing the database URL in `database.py`.

**Q: How do you handle state management in the frontend?**
A: We use React Context API for global state (AuthContext, ThemeContext) and local component state with useState/useReducer for component-specific data. This keeps the app simple without needing Redux.

### Authentication & Security

**Q: How does JWT authentication work in your app?**
A: On login, the server generates a JWT token with user email as subject and 480-minute expiration. The token is stored in localStorage and attached to every request via Axios interceptor. The backend validates the token signature and expiration before granting access.

**Q: What security measures have you implemented?**
A: Passwords are hashed with bcrypt, JWT tokens have expiration, role-based access control on both frontend and backend, SQL injection prevention via SQLAlchemy ORM, CORS configuration, and input validation with Pydantic.

**Q: How do you handle token expiration?**
A: Tokens expire after 480 minutes (8 hours). When a 401 error occurs, the Axios interceptor clears localStorage and redirects to login. Users must re-authenticate after expiration.

### Database & Models

**Q: Explain your database schema relationships.**
A: User has one-to-many relationships with Requisitions (as creator), Comments, Notifications, and Approvals (as approver). Requisition has one-to-many relationships with Comments and Approvals. This allows tracking complete audit trails and notification history.

**Q: Why do you use soft delete for users?**
A: Soft delete (setting is_active = False) preserves data integrity - historical requisitions and approvals remain intact even if a user is deactivated. This is important for audit trails and reporting.

**Q: How do you handle duplicate requisitions?**
A: The system checks for duplicates within the same category and department in the last 30 days. If found, it sets is_duplicate_flag = True but still allows creation. This alerts approvers to potential duplicates without blocking legitimate requests.

### AI Integration

**Q: How does the AI assistant work?**
A: The AI assistant uses Groq API with Llama 3 70B model. User provides natural language input, which is sent to the AI with a system prompt and few-shot examples. The AI returns structured JSON with extracted fields (title, category, amount, vendor, description). The frontend validates and applies this to the form.

**Q: Why did you choose Groq over OpenAI?**
A: Groq offers faster inference with lower latency at a lower cost, while still providing access to state-of-the-art models like Llama 3. It's ideal for real-time applications like form auto-filling.

**Q: How do you handle AI errors or hallucinations?**
A: We implement confidence scoring (high/medium/low) and clarification requests. For low confidence, we ask users to review carefully. We also validate the AI output (category must match allowed values, amount must be positive) and provide manual override.

### Frontend & UX

**Q: How do you handle responsive design?**
A: We use Tailwind CSS with responsive utilities (grid-cols-1 md:grid-cols-2 lg:grid-cols-3). The Kanban board uses auto-fit grid for columns, and cards adapt to screen size. Mobile-friendly layouts throughout.

**Q: What's the purpose of the glassmorphism design?**
A: Glassmorphism (translucent panels with backdrop blur) provides a modern, iOS-inspired aesthetic. It creates visual hierarchy while maintaining a clean, professional look suitable for enterprise applications.

**Q: How do you handle loading states and errors?**
A: We have LoadingSpinner and ErrorMessage components for consistent UX. API calls show loading states during fetch, and errors are displayed with toast notifications and retry options. Axios interceptor handles 401 errors globally.

### Business Logic

**Q: Explain the approval workflow logic.**
A: Requisitions flow through 4 stages: Dept Review → Finance Review → Procurement → Approved. Each stage requires a specific role (dept_head, finance, admin). Approvals move the requisition forward; rejections end the workflow. SLA deadlines (48 hours) are tracked per stage.

**Q: How do you calculate dashboard statistics?**
A: Dashboard stats are calculated server-side with role-based filtering. For example, dept heads see only their department's data, while admins see organization-wide data. We calculate totals, averages, and aggregations using SQLAlchemy queries.

**Q: How does SLA monitoring work?**
A: Each requisition has an sla_deadline set to 48 hours from stage entry. The dashboard counts requisitions where current_time > sla_deadline and stage is not approved/rejected. Visual indicators show "X days left" or "BREACHED by X days".

### Performance & Optimization

**Q: How do you optimize API performance?**
A: We use SQLAlchemy with efficient queries, role-based filtering to reduce data transfer, and pagination where needed. Frontend uses React.memo for component optimization and debounced search inputs.

**Q: How would you scale this application?**
A: For scaling: Switch SQLite to PostgreSQL, add Redis for caching, implement proper pagination, add database indexes on frequently queried fields, use CDN for static assets, and consider microservices for AI processing.

### Testing & Deployment

**Q: How would you test this application?**
A: Unit tests for business logic (approval workflow, SLA calculation), integration tests for API endpoints, E2E tests with Playwright for user flows, and manual testing for AI responses. Test with different user roles to verify permissions.

**Q: What would you change for production?**
A: Use PostgreSQL instead of SQLite, implement proper logging (instead of print statements), add rate limiting, implement email notifications (currently in-app only), add proper error monitoring (Sentry), use environment variables for all secrets, and add HTTPS.

---

## Demo Script

### Recommended Demo Flow

1. **Login Demo** (2 minutes)
   - Show login page with demo credentials
   - Log in as Employee (employee@procura.com / emp123)
   - Show dashboard with employee view

2. **Create Requisition with AI** (3 minutes)
   - Navigate to New Requisition
   - Use AI assistant: "5 Dell laptops for developers, 80k each"
   - Show AI extraction and confidence
   - Apply to form and submit
   - Show requisition in pipeline

3. **Approval Workflow** (5 minutes)
   - Log out, log in as Dept Head (depthead@procura.com / dept123)
   - Show dashboard with pending approvals
   - Navigate to pipeline, find requisition in Dept Review
   - View requisition details
   - Approve with comment
   - Log out, log in as Finance (finance@procura.com / finance123)
   - Approve at Finance Review stage
   - Log out, log in as Admin (admin@procura.com / admin123)
   - Approve at Procurement stage
   - Show final Approved status

4. **Analytics Demo** (2 minutes)
   - Show analytics page with charts
   - Explain SLA compliance rate
   - Show top departments and categories
   - Export report feature

5. **User Management** (1 minute)
   - Show Users page (admin only)
   - Demonstrate edit and deactivate
   - Show role badges and status indicators

6. **Features Overview** (2 minutes)
   - Show Kanban board with all stages
   - Demonstrate search and filter
   - Show SLA status indicators
   - Show duplicate flag
   - Show comment system

**Total Demo Time**: ~15 minutes

---

## Quick Reference

### API Base URL
- Development: `http://localhost:8000`
- Frontend Proxy: `/api`

### Key Files

**Backend:**
- `main.py` - App entry point, router inclusion
- `models.py` - Database models
- `auth.py` - Authentication utilities
- `routers/` - API endpoints
- `services/ai_assistant.py` - AI integration

**Frontend:**
- `src/App.jsx` - Routing setup
- `src/context/AuthContext.jsx` - Auth state
- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/api/axios.js` - HTTP client

### Environment Variables
- `GROQ_API_KEY` - Required for AI assistant
- `SECRET_KEY` - JWT signing key (change in production)

### Default Ports
- Backend: 8000
- Frontend: 5173

---

## Conclusion

This guide covers all major functionalities of the Operon application. For interviews, focus on:
1. **Architecture decisions** (technology choices, trade-offs)
2. **Security implementation** (auth, RBAC, data protection)
3. **AI integration** (how it works, error handling)
4. **Business logic** (approval workflow, SLA monitoring)
5. **Scalability considerations** (how to improve for production)

Good luck with your demo!
