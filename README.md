# EasyCall - Blockchain Intelligence Workflow Builder

Visual, no-code workflow builder for blockchain intelligence queries using Chainalysis Reactor and TRM Labs APIs.

![Python](https://img.shields.io/badge/python-3.11+-blue)
![Django](https://img.shields.io/badge/django-5.0-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 🎯 Overview

**EasyCall** transforms complex blockchain intelligence API interactions into a visual, drag-and-drop interface similar to Unreal Engine's Blueprint system. Build investigation workflows without writing code.

**Target Users:** Blockchain analysts, compliance officers, fraud investigators

**Key Features:**
- 🎨 Visual node-based workflow editor (React Flow)
- 🔗 Drag-and-drop node connections
- 📊 Chainalysis Reactor and TRM Labs API integration
- 📁 Batch process up to 10,000 addresses
- 📤 Export to Excel, CSV, JSON, TXT
- 💾 Portable SQLite database
- 🔐 Encrypted API credential storage
- ⚡ Real-time execution logging

---

## 🏗️ Architecture

**Backend:** Django 5.0 REST Framework  
**Frontend:** React 18.2 + Material-UI + React Flow  
**Database:** SQLite (portable)  
**APIs:** Chainalysis Reactor, TRM Labs

```
easycall/
├── backend/          # Django REST API
│   ├── apps/        # Django applications
│   │   ├── core/           # Base models, exceptions
│   │   ├── workflows/      # Workflow CRUD
│   │   ├── execution/      # Workflow execution engine
│   │   ├── nodes/          # Node implementations
│   │   ├── integrations/   # API clients
│   │   └── settings_manager/  # Global settings
│   ├── config/      # Django settings
│   └── manage.py    # Django CLI
│
└── frontend/        # React application
    └── src/         # React components
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Windows Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd easycall

# 2. Run setup script
setup-windows.bat

# 3. Start application
start-application.bat
```

**Application URLs:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/admin/

### Linux/macOS Setup

```bash
# 1. Clone repository
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

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Start development server
npm start
```

---

## 📚 API Documentation

Once the server is running:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **OpenAPI Schema:** http://localhost:8000/api/schema/

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health/` | GET | Health check |
| `/api/v1/workflows/` | GET, POST | List/create workflows |
| `/api/v1/workflows/{uuid}/` | GET, PUT, DELETE | Workflow detail |
| `/api/v1/execution/run/` | POST | Execute workflow |
| `/api/v1/settings/` | GET, PUT | Global settings |

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

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Specific test file
pytest tests/test_api/test_workflows_api.py

# Django shell (manual testing)
python manage.py shell
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# With coverage
npm test -- --coverage
```

---

## 🔧 Development Commands

### Django Commands

```bash
# Migrations
python manage.py makemigrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Linting
flake8

# Formatting
black .
isort .
```

### Frontend Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Linting
npm run lint
```

---

## 🔒 Security

- **API Keys:** Encrypted using Fernet (symmetric encryption)
- **Storage:** SQLite with restricted permissions
- **Transport:** HTTPS required in production
- **CORS:** Configured for specific origins only

### Environment Variables

**Backend `.env`:**
```bash
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
ENCRYPTION_KEY=generate-with-fernet

# API Keys (set in UI, not here)
CHAINALYSIS_API_KEY=
TRM_API_KEY=
```

**Frontend `.env`:**
```bash
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_BASE_URL=ws://localhost:8000/ws
```

---

## 📦 Tech Stack

### Backend
- **Django 5.0.14** - Web framework
- **Django REST Framework** - REST API
- **Django Channels** - WebSocket support
- **drf-spectacular** - API documentation
- **SQLite** - Database (portable)
- **cryptography** - API key encryption

### Frontend
- **React 18.2** - UI framework
- **TypeScript** - Type safety
- **Material-UI v5** - Component library
- **React Flow v11** - Visual canvas
- **Axios** - HTTP client

### Development Tools
- **pytest** - Testing framework
- **Flake8** - Linting
- **Black** - Code formatting
- **VSCode** - Recommended IDE

---

## 📖 Project Structure

```
easycall/
├── backend/
│   ├── apps/
│   │   ├── core/              # Base models, exceptions, utilities
│   │   ├── workflows/         # Workflow CRUD operations
│   │   ├── execution/         # Workflow execution engine
│   │   ├── nodes/             # Node type implementations
│   │   ├── integrations/      # External API clients
│   │   └── settings_manager/  # Global settings management
│   │
│   ├── config/
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # URL routing
│   │   ├── wsgi.py            # WSGI config
│   │   └── asgi.py            # ASGI config (WebSocket)
│   │
│   ├── fields/                # Centralized field definitions
│   │   ├── constants.py       # Numeric constants
│   │   ├── choices.py         # Enumerations
│   │   ├── names.py           # Field names
│   │   └── validators.py      # Validation functions
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── encryption.py      # API key encryption
│   │   └── helpers.py         # Helper functions
│   │
│   ├── tests/                 # Backend tests
│   ├── media/                 # User uploads
│   ├── logs/                  # Application logs
│   ├── db.sqlite3             # SQLite database
│   ├── requirements.txt       # Python dependencies
│   └── manage.py              # Django CLI
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   ├── api/               # API client
│   │   └── utils/             # Utilities
│   │
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
│
├── documentation/             # Project documentation
│   ├── RoadMap.md            # Development roadmap
│   └── API Integration Specification.md
│
├── .vscode/                   # VSCode configuration
│   ├── settings.json         # Editor settings
│   ├── launch.json           # Debug configs
│   └── extensions.json       # Recommended extensions
│
├── setup-windows.bat          # Windows setup
├── start-application.bat      # Windows launcher
├── setup-linux.sh             # Linux/Mac setup
├── start-application.sh       # Linux/Mac launcher
└── README.md                  # This file
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check Python version
python --version  # Should be 3.11+

# Check virtual environment
where python  # Should point to venv (Windows)
which python  # Should point to venv (Linux/Mac)

# Reinstall dependencies
pip install -r requirements.txt

# Check migrations
python manage.py showmigrations
python manage.py migrate
```

### Frontend Won't Start

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
rm db.sqlite3
python manage.py migrate
```

---

## 📈 Development Status

**Current Phase:** Phase 1 - Foundation & Core Backend (100% Complete) ✅

**Working Features:**
- ✅ Django server running
- ✅ Database models with migrations
- ✅ CRUD API for workflows
- ✅ Health check endpoints
- ✅ API documentation (Swagger/ReDoc)
- ✅ Admin panel

**Next Steps:**
- 🔄 React frontend setup
- 🔄 Visual workflow canvas
- 🔄 Node execution engine
- 🔄 API integrations (TRM Labs, Chainalysis)

See [RoadMap.md](documentation/RoadMap.md) for detailed progress.

---

## 🤝 Contributing

This is a proprietary project. For internal development:

1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow code style (Black, Flake8, type hints)
3. Add tests for new features
4. Update documentation
5. Create pull request

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions, contact the development team.

---

## 🎓 Code Quality Standards

This project follows professional Django/React development practices:

- ✅ **Type hints** throughout (Python)
- ✅ **Comprehensive docstrings** (Google style)
- ✅ **Section comments** for organization
- ✅ **Error handling** with custom exceptions
- ✅ **Centralized constants** (DRY principle)
- ✅ **Abstract base models** for consistency
- ✅ **Soft delete** pattern (data safety)
- ✅ **Structured logging**
- ✅ **REST best practices**
- ✅ **Test coverage** (pytest + Django test client)

---

**Last Updated:** December 19, 2025  
**Version:** 0.1.0  
**Python:** 3.11+  
**Django:** 5.0.14  
**React:** 18.2