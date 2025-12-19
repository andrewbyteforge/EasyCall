# EasyCall - Blockchain Intelligence Workflow Builder

Visual, no-code workflow builder for blockchain intelligence queries with dynamic API provider management.

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
- 🔌 **Dynamic API provider management system**
- 📊 Chainalysis Reactor and TRM Labs API integration
- 🤖 **Automatic node generation from OpenAPI specifications**
- 🛠️ **Admin interface for provider lifecycle management**
- 📈 **Provider versioning and safe removal**
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
**Provider System:** Database-driven with OpenAPI spec parsing  
**APIs:** Dynamic integration (Chainalysis Reactor, TRM Labs, Etherscan, CoinGecko, OFAC, etc.)
```
easycall/
├── backend/          # Django REST API
│   ├── apps/        # Django applications
│   │   ├── core/              # Base models, exceptions
│   │   ├── workflows/         # Workflow CRUD
│   │   ├── execution/         # Workflow execution engine
│   │   ├── nodes/             # Node implementations
│   │   ├── integrations/      # API clients
│   │   ├── providers/         # Provider management system (NEW)
│   │   │   ├── models.py      # Provider, APIEndpoint, GeneratedNode
│   │   │   ├── parser.py      # OpenAPI spec parser
│   │   │   ├── generator.py   # Node auto-generation engine
│   │   │   └── admin.py       # Admin interface for providers
│   │   └── settings_manager/  # Global settings
│   ├── config/      # Django settings
│   ├── providers/   # Provider artifacts (NEW)
│   │   ├── specs/             # Uploaded OpenAPI specifications
│   │   ├── generated/         # Auto-generated node configs
│   │   └── overrides/         # Custom provider logic
│   └── manage.py    # Django CLI
│
└── frontend/        # React application
    └── src/         # React components
        └── components/
            └── admin/         # Admin UI components (NEW)
                ├── ProviderManager.tsx
                ├── SpecUploader.tsx
                └── WorkflowImpactAnalyzer.tsx
```

---

## 🔌 Provider Management System

### Core Concept

EasyCall features a **database-driven provider management system** that allows dynamic addition and removal of blockchain intelligence API providers without code changes. This "revolving door" architecture ensures the platform can adapt to the rapidly evolving blockchain intelligence ecosystem.

### How It Works

#### 1. **Provider Registration**
- Upload OpenAPI/Swagger specification file
- System automatically parses endpoints, parameters, and authentication methods
- Generates credential nodes, query nodes, and output mappings
- Provider becomes immediately available in the node palette

#### 2. **Automatic Node Generation**
From a single OpenAPI spec, the system creates:
- **Credential Node:** Authentication inputs based on detected auth type (API Key, Bearer Token, OAuth)
- **Query Nodes:** One node per API endpoint with:
  - Input pins for required/optional parameters
  - Output pins from response schemas
  - Automatic validation rules
  - Rate limit configurations
- **TypeScript Definitions:** Type-safe interfaces for frontend

#### 3. **Provider Lifecycle Management**

**States:**
- **Active:** Available for new workflows
- **Deprecated:** Hidden from node palette, existing workflows still work
- **Inactive:** Soft-deleted, retained for historical workflows

**Safe Removal Process:**
1. Check workflow dependencies (which workflows use this provider)
2. Display impact analysis to admin
3. Choose removal strategy:
   - Soft delete (hide but keep functional)
   - Version lock (maintain specific version for old workflows)
   - Migration assistant (suggest replacement provider)

#### 4. **Version Control**
- Providers support semantic versioning (v1.0, v2.0)
- Workflows lock to specific provider version
- API changes don't break existing workflows
- Admin can maintain multiple versions simultaneously

### Architecture Benefits

✅ **No Code Deployments:** Add providers via admin UI  
✅ **Future-Proof:** Adapt to market changes instantly  
✅ **Version Safety:** Existing workflows never break  
✅ **Audit Trail:** Complete history of provider changes  
✅ **Scalability:** Support dozens of providers effortlessly  
✅ **Standardization:** Consistent node behavior across providers  

### Database Schema
```
Provider
├─ id, name, slug, status (active/deprecated/inactive)
├─ base_url, auth_type, icon_path
├─ spec_file_path, version
├─ created_at, updated_at

APIEndpoint
├─ provider_id (FK)
├─ path, method, description
├─ parameters (JSON schema)
├─ response_schema (JSON schema)
├─ rate_limit, timeout

GeneratedNode
├─ provider_id (FK)
├─ endpoint_id (FK)
├─ node_type, category, display_name
├─ input_pins (JSON)
├─ output_pins (JSON)
├─ validation_rules (JSON)

WorkflowNode (extended)
├─ provider_id (FK)
├─ provider_version
├─ frozen_config (snapshot of node at creation)
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
- **Provider Admin:** http://localhost:8000/admin/providers/ (NEW)

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

# Create superuser (required for provider admin)
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
| `/api/v1/providers/` | GET, POST | List/create providers |
| `/api/v1/providers/{id}/` | GET, PUT, DELETE | Provider detail |
| `/api/v1/providers/{id}/upload-spec/` | POST | Upload OpenAPI spec |
| `/api/v1/providers/{id}/generate-nodes/` | POST | Generate nodes from spec |
| `/api/v1/providers/{id}/impact-analysis/` | GET | Workflow dependency check |

---

## 🎨 Node System

### Dynamic Node Architecture

Unlike traditional static node systems, EasyCall generates nodes **dynamically** from provider specifications:

- **No hardcoded nodes:** All nodes are database records
- **Instant updates:** Provider changes reflect immediately
- **Type safety:** Auto-generated TypeScript interfaces
- **Consistent behavior:** Standardized node patterns across providers

### Current Providers

#### Chainalysis Reactor
- Cluster Info, Balance, Counterparties
- Transaction Details
- Exposure by Category/Service

#### TRM Labs
- Address Attribution
- Total Exposure
- Address Summary, Transfers
- Network Intelligence

#### Planned Free APIs
- Etherscan (Ethereum blockchain data)
- CoinGecko (market data)
- OFAC Sanctions List (compliance screening)

### Node Categories

**Configuration Nodes:** Provider credentials (auto-generated per provider)  
**Input Nodes:** Single address, batch upload, transaction hash  
**Query Nodes:** Generated from API endpoints (dynamic)  
**Output Nodes:** TXT, Excel, JSON, CSV, Console (static)

---

## 🔧 Provider Management Workflow

### Adding a New Provider

**Via Admin UI:**

1. Navigate to Admin → Providers
2. Click "Add Provider"
3. Fill in basic details:
   - Name, slug, base URL
   - Icon (optional)
4. Upload OpenAPI specification file
5. Click "Parse & Generate Nodes"
6. Review generated nodes
7. Set status to "Active"
8. Provider appears in node palette instantly

**Supported Spec Formats:**
- OpenAPI 3.0/3.1 (JSON/YAML)
- Swagger 2.0 (JSON/YAML)

**Manual Entry (if no spec available):**
- Use the "Manual Endpoint Entry" form
- Define endpoints, parameters, and responses
- System generates nodes from manual definitions

### Removing a Provider

**Safe Removal Steps:**

1. Navigate to provider detail page
2. Click "Analyze Impact"
3. Review affected workflows:
   - Count of workflows using this provider
   - List of specific workflow names
   - Last execution dates
4. Choose removal strategy:
   - **Deprecate:** Hide from new workflows, keep functional
   - **Version Lock:** Freeze at current version, allow updates separately
   - **Delete:** Remove completely (only if no dependencies)
5. Confirm action

**Protection Mechanisms:**
- Cannot delete provider with active workflows (without force flag)
- Deprecation happens automatically when newer version added
- Workflow nodes retain snapshot of configuration at creation

### Versioning Strategy
```
Provider: Chainalysis v1.0 → v2.0 (breaking change)
├─ Old workflows continue using v1.0 (frozen)
├─ New workflows default to v2.0
├─ Admin can manually migrate workflows
└─ Both versions maintained until v1.0 deprecated
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Test provider system specifically
pytest tests/test_providers/

# Test OpenAPI parser
pytest tests/test_providers/test_parser.py

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

# Test provider components
npm test -- ProviderManager
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

# Provider management commands
python manage.py parse_openapi_spec <provider_id> <spec_file_path>
python manage.py generate_nodes <provider_id>
python manage.py list_providers
python manage.py deprecate_provider <provider_id>

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
- **Provider Specs:** Validated before parsing (prevent injection)
- **Admin Access:** Role-based permissions for provider management

### Environment Variables

**Backend `.env`:**
```bash
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
ENCRYPTION_KEY=generate-with-fernet

# API Keys (set in UI or environment)
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
- **prance** - OpenAPI spec parser (NEW)
- **openapi-spec-validator** - Spec validation (NEW)

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
│   │   ├── providers/         # Provider management system (NEW)
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # Provider, APIEndpoint, GeneratedNode
│   │   │   ├── serializers.py # DRF serializers
│   │   │   ├── views.py       # REST API views
│   │   │   ├── parser.py      # OpenAPI spec parser
│   │   │   ├── generator.py   # Node auto-generation engine
│   │   │   ├── admin.py       # Django admin interface
│   │   │   ├── validators.py  # Spec validation
│   │   │   └── utils.py       # Helper functions
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
│   ├── providers/             # Provider artifacts (NEW)
│   │   ├── specs/             # Uploaded OpenAPI specifications
│   │   │   ├── chainalysis_v1.yaml
│   │   │   ├── trm_labs_v2.json
│   │   │   └── etherscan_v1.yaml
│   │   ├── generated/         # Auto-generated node configs
│   │   │   ├── chainalysis/
│   │   │   ├── trm_labs/
│   │   │   └── etherscan/
│   │   └── overrides/         # Custom provider logic
│   │       ├── chainalysis.py
│   │       └── trm_labs.py
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── encryption.py      # API key encryption
│   │   └── helpers.py         # Helper functions
│   │
│   ├── tests/                 # Backend tests
│   │   ├── test_providers/    # Provider system tests (NEW)
│   │   │   ├── test_models.py
│   │   │   ├── test_parser.py
│   │   │   ├── test_generator.py
│   │   │   └── test_api.py
│   │   └── ...
│   │
│   ├── media/                 # User uploads
│   ├── logs/                  # Application logs
│   ├── db.sqlite3             # SQLite database
│   ├── requirements.txt       # Python dependencies
│   └── manage.py              # Django CLI
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── admin/         # Admin UI components (NEW)
│   │   │   │   ├── ProviderManager.tsx
│   │   │   │   ├── ProviderList.tsx
│   │   │   │   ├── ProviderForm.tsx
│   │   │   │   ├── SpecUploader.tsx
│   │   │   │   ├── NodePreview.tsx
│   │   │   │   ├── WorkflowImpactAnalyzer.tsx
│   │   │   │   └── VersionManager.tsx
│   │   │   ├── canvas/        # Workflow canvas
│   │   │   ├── nodes/         # Node components
│   │   │   └── ...
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   │   ├── provider.ts    # Provider types (NEW)
│   │   │   └── ...
│   │   ├── api/               # API client
│   │   │   ├── providers.ts   # Provider API calls (NEW)
│   │   │   └── ...
│   │   └── utils/             # Utilities
│   │
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
│
├── documentation/             # Project documentation
│   ├── RoadMap.md            # Development roadmap
│   ├── Provider_System.md    # Provider management guide (NEW)
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

## 🛠 Troubleshooting

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

### Provider Issues
```bash
# Provider won't activate
python manage.py list_providers  # Check status
python manage.py validate_spec <provider_id>

# Nodes not appearing
python manage.py generate_nodes <provider_id> --force

# Check OpenAPI spec
python manage.py parse_openapi_spec <provider_id> <spec_path> --dry-run
```

---

## 📈 Development Status

**Current Phase:** Phase 2 - Provider Management System (In Progress) 🔄

**Completed:**
- ✅ Phase 1: Foundation & Core Backend (100%)
  - Django server running
  - Database models with migrations
  - CRUD API for workflows
  - Health check endpoints
  - API documentation (Swagger/ReDoc)
  - Admin panel

**In Progress:**
- 🔄 Phase 2: Provider Management System (40%)
  - ✅ Architecture design complete
  - ✅ README documentation updated
  - ⏳ Database schema implementation
  - ⏳ OpenAPI spec parser
  - ⏳ Node auto-generation engine
  - ⏳ Admin interface
  - ⏳ Versioning system

**Next Steps:**
- 📅 React frontend setup
- 📅 Visual workflow canvas
- 📅 Node execution engine
- 📅 API integrations (TRM Labs, Chainalysis)

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
- ✅ **Database-driven architecture** (scalability)
- ✅ **Dynamic configuration** (no hardcoded providers)

---

**Last Updated:** December 19, 2025  
**Version:** 0.2.0  
**Python:** 3.11+  
**Django:** 5.0.14  
**React:** 18.2