# EasyCall - Blockchain Intelligence Workflow Builder

A visual, no-code workflow builder that enables non-technical users to create complex blockchain intelligence queries by connecting nodes on a canvas. Integrates with Chainalysis Reactor and TRM Labs APIs to democratize blockchain analysis.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Django](https://img.shields.io/badge/django-5.0-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)

---

## 🎯 Project Overview

**Purpose:** Transform complex API interactions with Chainalysis Reactor and TRM Labs into a visual, drag-and-drop interface similar to Unreal Engine's Blueprint system.

**Target Users:** Blockchain analysts, compliance officers, fraud investigators

**Key Features:**
- 🎨 Visual node-based workflow editor (React Flow)
- 🔗 Drag-and-drop node connections
- 📊 Support for Chainalysis Reactor and TRM Labs APIs
- 📁 Batch processing up to 10,000 addresses
- 📤 Multiple export formats (Excel, CSV, JSON, TXT)
- 💾 Portable SQLite database (USB stick compatible)
- 🔐 Encrypted API credential storage
- ⚡ Real-time execution logging via WebSocket

---

## 🏗️ Architecture

**Backend:** Django 5.0 REST Framework  
**Frontend:** React 18.2 + Material-UI + React Flow  
**Database:** SQLite (for portability)  
**APIs:** Chainalysis Reactor, TRM Labs

---

## 📋 Prerequisites

### Required Software
- **Python:** 3.11 or higher
- **Node.js:** 18 LTS or higher
- **Git:** Latest version
- **Code Editor:** Visual Studio Code (recommended)

### API Access (Optional for Development)
- Chainalysis Reactor API key (for production use)
- TRM Labs API key (for production use)

*Note: You can develop and test the full application without API keys using placeholder nodes.*

---

## 🚀 Quick Start

### Windows

```bash
# 1. Clone the repository
git clone <repository-url>
cd easycall

# 2. Run setup script
setup-windows.bat

# 3. Start application
start-application.bat
```

The application will launch:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs/

### Linux / macOS

```bash
# 1. Clone the repository
git clone <repository-url>
cd easycall

# 2. Run setup script
chmod +x setup-linux.sh
./setup-linux.sh

# 3. Start application
chmod +x start-application.sh
./start-application.sh
```

---

## 🛠️ Manual Setup (Development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

**Backend will be available at:** http://localhost:8000

**Admin panel:** http://localhost:8000/admin/  
**API Documentation:** http://localhost:8000/api/docs/

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm start
```

**Frontend will be available at:** http://localhost:3000

---

## 📁 Project Structure

```
easycall/
├── backend/                     # Django REST API
│   ├── manage.py               # Django management script
│   ├── config/                 # Django project configuration
│   │   ├── settings.py        # Main settings
│   │   ├── urls.py            # URL routing
│   │   ├── wsgi.py            # WSGI configuration
│   │   └── asgi.py            # ASGI configuration (Channels)
│   │
│   ├── apps/                   # Django applications
│   │   ├── core/              # Core utilities, base models
│   │   ├── workflows/         # Workflow management
│   │   ├── execution/         # Workflow execution engine
│   │   ├── nodes/             # Node type definitions
│   │   ├── integrations/      # External API clients
│   │   └── settings_manager/  # Global settings
│   │
│   ├── fields/                 # Centralized field definitions
│   │   ├── constants.py       # Numeric constants
│   │   ├── choices.py         # Enumerations
│   │   ├── names.py           # Field names
│   │   └── validators.py      # Validation functions
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── encryption.py      # API key encryption
│   │   └── helpers.py         # Helper functions
│   │
│   ├── tests/                  # Backend tests
│   ├── media/                  # Uploaded files
│   ├── logs/                   # Application logs
│   └── db.sqlite3             # SQLite database
│
├── frontend/                   # React application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── canvas/       # Workflow canvas
│   │   │   ├── nodes/        # Custom node components
│   │   │   └── dialogs/      # Dialog components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript definitions
│   │   ├── api/              # API client
│   │   └── utils/            # Utility functions
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript config
│
├── documentation/              # Project documentation
│   ├── RoadMap.md            # Development roadmap
│   ├── API Integration Specification.md
│   └── README.md             # This file
│
├── .vscode/                   # VSCode configuration
│   ├── settings.json         # Editor settings
│   ├── launch.json           # Debug configurations
│   └── extensions.json       # Recommended extensions
│
├── setup-windows.bat          # Windows setup script
├── start-application.bat      # Windows start script
└── .gitignore                # Git ignore rules
```

---

## 🎨 Node Types (21 Total)

### Configuration Nodes (2)
- Chainalysis Credentials
- TRM Labs Credentials

### Input Nodes (3)
- Single Address Input
- Batch Address Input (CSV, Excel, PDF, Word)
- Transaction Hash Input

### Query Nodes - Chainalysis (6)
- Cluster Info
- Cluster Balance
- Cluster Counterparties
- Transaction Details
- Exposure by Category
- Exposure by Service

### Query Nodes - TRM Labs (5)
- Address Attribution
- Total Exposure
- Address Summary
- Address Transfers
- Network Intelligence

### Output Nodes (5)
- TXT Export
- Excel Export
- JSON Export
- CSV Export
- Console Log

---

## 🔧 Development Commands

### Django Commands
```bash
# Start server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Run tests
pytest
```

### Frontend Commands
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **Admin Panel:** http://localhost:8000/admin/

### Available Endpoints

#### Core
- `GET /api/v1/health/` - Health check
- `GET /api/v1/health/detailed/` - Detailed health check
- `GET /api/v1/info/` - System information
- `GET /api/v1/ping/` - Connectivity test

#### Workflows
- `GET /api/v1/workflows/` - List workflows
- `POST /api/v1/workflows/` - Create workflow
- `GET /api/v1/workflows/{uuid}/` - Get workflow
- `PUT /api/v1/workflows/{uuid}/` - Update workflow
- `DELETE /api/v1/workflows/{uuid}/` - Delete workflow

#### Execution
- `POST /api/v1/execution/run/` - Execute workflow
- `GET /api/v1/execution/{uuid}/` - Get execution status
- `GET /api/v1/execution/logs/` - Get execution logs

#### Settings
- `GET /api/v1/settings/` - Get global settings
- `PUT /api/v1/settings/` - Update settings

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Specific test file
pytest tests/test_api/test_workflows_api.py
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

---

## 🔒 Security

- **API Keys:** Encrypted using Fernet (symmetric encryption)
- **Storage:** SQLite database with restricted permissions
- **Transport:** HTTPS required in production
- **CORS:** Configured for specific origins only

---

## 📝 Environment Variables

### Backend (.env)
```bash
# Application
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database (SQLite - no config needed)

# API Keys (set in UI, not here)
CHAINALYSIS_API_KEY=
TRM_API_KEY=

# Encryption
ENCRYPTION_KEY=generate-with-fernet

# Logging
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_BASE_URL=ws://localhost:8000/ws
REACT_APP_NAME=Blockchain Intelligence Workflow Builder
```

---

## 🚀 Deployment (Future)

This application is designed to run from a USB stick for maximum portability. For production deployment:

1. Set `DEBUG=False` in settings
2. Configure proper `SECRET_KEY`
3. Set up HTTPS
4. Use proper CORS origins
5. Configure logging to persistent storage
6. Back up SQLite database regularly

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Check virtual environment is activated
which python  # Should point to venv

# Reinstall dependencies
pip install -r requirements.txt

# Check migrations
python manage.py showmigrations
python manage.py migrate
```

### Frontend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check port availability
netstat -ano | findstr :3000
```

### Database issues
```bash
# Reset database (WARNING: deletes all data)
rm db.sqlite3
python manage.py migrate
```

---

## 📖 Documentation

See the `documentation/` folder for:
- **RoadMap.md** - Development progress
- **API Integration Specification.md** - Complete API integration details
- **FastAPI React Project Structure.md** - Original structure reference

---

## 🤝 Contributing

This is a proprietary project. For internal development:

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with proper commits
3. Test thoroughly
4. Create pull request

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions, contact the development team.

---

## 🎯 Current Status

**Phase:** Phase 1 - Foundation & Core Backend (75% Complete)

**Working:**
- ✅ Django server running
- ✅ Database models created
- ✅ Health check endpoints
- ✅ API documentation (Swagger/ReDoc)
- ✅ Admin panel

**In Progress:**
- 🔄 Workflow CRUD API
- 🔄 Execution engine
- 🔄 React frontend setup

**Next Steps:**
1. Complete workflow serializers and viewsets
2. Set up React frontend with Material-UI
3. Implement node execution engine
4. Integrate TRM Labs API

---

*Last Updated: December 4, 2025*