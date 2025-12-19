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
- 🔌 **Dynamic API integration system** ✅ COMPLETE
- 📊 Chainalysis Reactor and TRM Labs API integration
- 🤖 **Automatic node generation from OpenAPI specifications** ✅ COMPLETE
- 🛠️ **Admin interface for specification management** ✅ COMPLETE
- 📈 **API versioning and specification tracking** ✅ COMPLETE
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
**Integration System:** OpenAPI-driven with automatic node generation ✅  
**APIs:** Dynamic integration (Chainalysis Reactor, TRM Labs, Custom APIs via OpenAPI specs)
```
easycall/
├── backend/          # Django REST API
│   ├── apps/        # Django applications
│   │   ├── core/              # Base models, exceptions
│   │   ├── workflows/         # Workflow CRUD ✅
│   │   ├── execution/         # Workflow execution engine ✅
│   │   ├── nodes/             # Node implementations
│   │   ├── integrations/      # OpenAPI integration system ✅ NEW
│   │   │   ├── models.py      # OpenAPISpec model ✅
│   │   │   ├── openapi_parser.py    # Spec parser ✅
│   │   │   ├── node_generator.py    # Node auto-generation ✅
│   │   │   ├── serializers.py       # DRF serializers ✅
│   │   │   ├── views.py             # REST API views ✅
│   │   │   ├── admin.py             # Django admin ✅
│   │   │   └── tests.py             # Unit tests ✅
│   │   └── settings_manager/  # Global settings ✅
│   ├── config/      # Django settings
│   ├── media/       # User uploads (OpenAPI specs) ✅
│   │   └── api_specs/         # Uploaded specifications ✅
│   ├── test_data/   # Sample OpenAPI specs for testing ✅
│   └── manage.py    # Django CLI
│
└── frontend/        # React application (Next Phase)
    └── src/         # React components
        └── components/
            └── admin/         # Admin UI components (Planned)
                ├── SpecManager.tsx
                ├── SpecUploader.tsx
                └── NodePreview.tsx
```

---

## 🔌 OpenAPI Integration System

### Core Concept

EasyCall features a **database-driven integration system** that allows dynamic addition of blockchain intelligence API providers through OpenAPI specification upload. This eliminates hardcoded API integrations and enables rapid adaptation to the evolving blockchain intelligence ecosystem.

### How It Works

#### 1. **Specification Upload** ✅ COMPLETE
- Upload OpenAPI 3.0/Swagger 2.0 specification files (YAML or JSON)
- System automatically validates and parses the specification
- Extracts endpoints, parameters, authentication, and response schemas
- Stores parsed data in database for node generation

#### 2. **Automatic Node Generation** ✅ COMPLETE
From a single OpenAPI spec, the system creates:
- **Node Type Definitions:** One node per API endpoint with:
  - Input pins for required/optional parameters (path, query, body)
  - Output pins from response schemas
  - Configuration fields (timeout, retry)
  - Proper data type mapping (ADDRESS, STRING, NUMBER, etc.)
- **Metadata:** Operation IDs, descriptions, tags
- **Validation Rules:** Required fields, data types, formats

#### 3. **Specification Lifecycle Management** ✅ COMPLETE

**Database Schema:**
```python
OpenAPISpec
├─ uuid (primary key)
├─ provider (chainalysis, trm_labs, custom)
├─ name, description, version
├─ spec_file (uploaded YAML/JSON)
├─ parsed_data (extracted endpoints as JSON)
├─ is_parsed (parsing status)
├─ parse_error (error message if failed)
└─ timestamps (created_at, updated_at)
```

**API Endpoints:**
- `GET /api/v1/integrations/specs/` - List all specifications
- `POST /api/v1/integrations/specs/` - Upload new specification (auto-parses)
- `GET /api/v1/integrations/specs/{uuid}/` - Get specification details
- `POST /api/v1/integrations/specs/{uuid}/parse/` - Re-parse specification
- `POST /api/v1/integrations/specs/{uuid}/generate/` - Generate workflow nodes
- `DELETE /api/v1/integrations/specs/{uuid}/` - Remove specification (soft delete)

#### 4. **Admin Interface** ✅ COMPLETE
Django admin provides:
- Specification upload and management
- Parse status monitoring
- Endpoint count display
- Bulk actions (parse selected, generate nodes)
- Impact analysis before deletion
- Parsed data visualization

### Architecture Benefits

✅ **No Code Deployments:** Add API providers via admin UI  
✅ **Standardized Integration:** Consistent node behavior across all providers  
✅ **Rapid Prototyping:** Test new APIs in minutes  
✅ **Version Tracking:** Track API versions and changes  
✅ **Error Recovery:** Detailed parse error messages  
✅ **Type Safety:** Automatic type mapping from OpenAPI schemas  

### Supported Specifications

**Format Support:**
- OpenAPI 3.0.x (YAML, JSON) ✅
- OpenAPI 3.1.x (YAML, JSON) ✅
- Swagger 2.0 (YAML, JSON) - Coming Soon

**File Validation:**
- Maximum file size: 5MB
- Allowed extensions: .yaml, .yml, .json
- Automatic version detection
- Schema validation

### Example: Generated Node from OpenAPI

**Input OpenAPI Endpoint:**
```yaml
/addresses/{address}/attribution:
  get:
    operationId: getAddressAttribution
    summary: Get Address Attribution
    parameters:
      - name: address
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                entities:
                  type: array
                entity_count:
                  type: integer
```

**Generated Node Definition:**
```python
{
  "type": "trm_labs_getaddressattribution",
  "name": "Get Address Attribution",
  "category": "query",
  "provider": "trm_labs",
  "inputs": [
    {"id": "credentials", "type": "CREDENTIALS", "required": True},
    {"id": "address", "type": "ADDRESS", "required": True}
  ],
  "outputs": [
    {"id": "entities", "type": "ADDRESS_LIST"},
    {"id": "entity_count", "type": "NUMBER"}
  ],
  "config": [
    {"id": "timeout", "type": "number", "default": 30},
    {"id": "retry", "type": "boolean", "default": True}
  ]
}
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
- Frontend: http://localhost:3000 (Coming Soon)
- API Docs: http://localhost:8000/api/docs/
- Admin: http://localhost:8000/admin/
- **Integrations Admin:** http://localhost:8000/admin/integrations/openapispec/ ✅

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

# Create superuser (required for admin access)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend (Coming Soon)
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
| `/api/v1/workflows/{uuid}/execute/` | POST | Execute workflow |
| `/api/v1/execution/logs/` | GET | Execution logs |
| `/api/v1/settings/` | GET, PUT | Global settings |
| `/api/v1/settings/credentials/` | GET, POST | API credentials |

### Integration Endpoints ✅ NEW

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/integrations/specs/` | GET, POST | List/upload specifications |
| `/api/v1/integrations/specs/{uuid}/` | GET, PUT, DELETE | Specification detail |
| `/api/v1/integrations/specs/{uuid}/parse/` | POST | Parse specification |
| `/api/v1/integrations/specs/{uuid}/generate/` | POST | Generate nodes from spec |

---

## 🎨 Node System

### Dynamic Node Architecture ✅ IMPLEMENTED

EasyCall generates nodes **dynamically** from OpenAPI specifications:

- **Automatic Generation:** Upload spec → Auto-generate nodes
- **Type Safety:** OpenAPI types mapped to workflow data types
- **Consistent Behavior:** Standardized patterns across all providers
- **Instant Updates:** Specification changes reflected immediately

### Data Type Mapping

| OpenAPI Type | Workflow Type |
|--------------|---------------|
| `string` | `STRING` |
| `integer` / `number` | `NUMBER` |
| `boolean` | `BOOLEAN` |
| `array` | `ADDRESS_LIST` |
| `object` | `JSON_DATA` |

### Current Providers

#### TRM Labs (Sample Spec Tested ✅)
- Get Address Attribution
- Get Risk Exposure
- Get Address Summary
- Batch Address Analysis

#### Chainalysis (Sample Spec Tested ✅)
- Get Cluster Information
- Get Cluster Balance
- Get Category Exposure
- Get Transaction Details

#### Planned Free APIs
- Etherscan (Ethereum blockchain data)
- CoinGecko (market data)
- OFAC Sanctions List (compliance screening)

### Node Categories

**Configuration Nodes:** Provider credentials (auto-generated per provider)  
**Input Nodes:** Single address, batch upload, transaction hash  
**Query Nodes:** Generated from API endpoints (dynamic) ✅  
**Output Nodes:** TXT, Excel, JSON, CSV, Console (static)

---

## 🧪 Testing

### Backend Tests ✅ PASSING
```bash
cd backend

# Run integration tests
python test_integration.py

# Run unit tests
python manage.py test apps.integrations

# With coverage
pytest --cov=apps.integrations --cov-report=html

# Test OpenAPI parser
python manage.py test apps.integrations.tests.OpenAPIParserTests

# Test node generator
python manage.py test apps.integrations.tests.NodeGeneratorTests
```

**Test Results:**
```
✅ Parsed TRM Labs YAML spec (4 endpoints)
✅ Parsed Chainalysis JSON spec (4 endpoints)
✅ Generated 4 TRM Labs nodes
✅ Generated 4 Chainalysis nodes
✅ Database CRUD operations working
✅ All tests passed
```

### Frontend Tests (Coming Soon)
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

# Run integration tests
python test_integration.py

# Linting
flake8

# Formatting
black .
isort .
```

### Frontend Commands (Coming Soon)
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
- **File Upload:** Validated extensions and size limits (5MB max)
- **OpenAPI Specs:** Validated before parsing (prevent injection)
- **Admin Access:** Role-based permissions for specification management

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
```

---

## 📦 Tech Stack

### Backend
- **Django 5.0.14** - Web framework
- **Django REST Framework** - REST API
- **drf-spectacular** - API documentation
- **SQLite** - Database (portable)
- **cryptography** - API key encryption
- **PyYAML** - YAML parsing ✅ NEW
- **pytest** - Testing framework

### Frontend (Coming Soon)
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
│   │   ├── core/              # Base models, exceptions, utilities ✅
│   │   ├── workflows/         # Workflow CRUD operations ✅
│   │   ├── execution/         # Workflow execution engine ✅
│   │   ├── nodes/             # Node type implementations
│   │   ├── integrations/      # OpenAPI integration system ✅ NEW
│   │   │   ├── __init__.py
│   │   │   ├── models.py      # OpenAPISpec model ✅
│   │   │   ├── serializers.py # DRF serializers ✅
│   │   │   ├── views.py       # REST API views ✅
│   │   │   ├── openapi_parser.py    # Spec parser ✅
│   │   │   ├── node_generator.py    # Node auto-generation ✅
│   │   │   ├── admin.py       # Django admin interface ✅
│   │   │   ├── urls.py        # URL routing ✅
│   │   │   ├── tests.py       # Unit tests ✅
│   │   │   └── migrations/    # Database migrations ✅
│   │   └── settings_manager/  # Global settings management ✅
│   │
│   ├── config/
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # URL routing (includes integrations) ✅
│   │   ├── wsgi.py            # WSGI config
│   │   └── asgi.py            # ASGI config
│   │
│   ├── fields/                # Centralized field definitions ✅
│   │   ├── constants.py       # Numeric constants
│   │   ├── choices.py         # Enumerations
│   │   ├── names.py           # Field names (includes API fields) ✅
│   │   └── validators.py      # Validation functions
│   │
│   ├── media/                 # User uploads ✅ NEW
│   │   └── api_specs/         # Uploaded OpenAPI specifications ✅
│   │
│   ├── test_data/             # Sample specifications for testing ✅ NEW
│   │   ├── trm_labs_sample.yaml      # TRM Labs sample ✅
│   │   └── chainalysis_sample.json   # Chainalysis sample ✅
│   │
│   ├── static/                # Static files (CSS, JS)
│   ├── logs/                  # Application logs
│   ├── db.sqlite3             # SQLite database
│   ├── requirements.txt       # Python dependencies (includes PyYAML) ✅
│   ├── test_integration.py    # Integration test script ✅
│   └── manage.py              # Django CLI
│
├── frontend/                  # React application (Next Phase)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── admin/         # Admin UI components (Planned)
│   │   │   │   ├── SpecManager.tsx
│   │   │   │   ├── SpecUploader.tsx
│   │   │   │   └── NodePreview.tsx
│   │   │   ├── canvas/        # Workflow canvas
│   │   │   └── nodes/         # Node components
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   ├── api/               # API client
│   │   └── utils/             # Utilities
│   │
│   └── package.json           # Node dependencies
│
├── documentation/             # Project documentation
│   ├── RoadMap.md            # Development roadmap
│   └── API Integration Specification2.md
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

### Frontend Won't Start (Coming Soon)
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

### Integration Issues ✅ NEW
```bash
# Specification won't parse
# Check file format (YAML/JSON)
# Verify OpenAPI version 3.0+
# Check file size (<5MB)

# Run manual parsing test
python test_integration.py

# View parse errors in admin
http://localhost:8000/admin/integrations/openapispec/

# Re-parse specification
POST /api/v1/integrations/specs/{uuid}/parse/
```

---

## 📈 Development Status

**Current Phase:** Phase 2 - OpenAPI Integration System ✅ COMPLETE

### ✅ Completed Features

#### Phase 1: Foundation & Core Backend (100%)
- ✅ Django server running
- ✅ Database models with migrations
- ✅ CRUD API for workflows
- ✅ Execution logging system
- ✅ Health check endpoints
- ✅ API documentation (Swagger/ReDoc)
- ✅ Admin panel
- ✅ API credential management
- ✅ Settings management

#### Phase 2: OpenAPI Integration System (100%) ✅ COMPLETE
- ✅ OpenAPISpec database model
- ✅ File upload handling (YAML/JSON)
- ✅ OpenAPI 3.0 parser implementation
- ✅ Node auto-generation engine
- ✅ Type mapping (OpenAPI → Workflow)
- ✅ REST API endpoints (list, create, parse, generate)
- ✅ Django admin interface
- ✅ Serializers and validation
- ✅ Unit tests (100% passing)
- ✅ Integration tests (100% passing)
- ✅ Sample specifications (TRM Labs, Chainalysis)
- ✅ Error handling and logging
- ✅ Media file storage configuration

**Test Results:**
```
================================================================================
ALL TESTS PASSED ✓
================================================================================
✓ Parsed TRM Labs YAML spec (4 endpoints)
✓ Parsed Chainalysis JSON spec (4 endpoints)
✓ Generated 4 TRM Labs nodes (12 inputs, 22 outputs total)
✓ Generated 4 Chainalysis nodes (8 inputs, 22 outputs total)
✓ Database operations (create, parse, delete) working
================================================================================
```

### 🔄 Next Phase Options

#### Phase 3: Frontend Integration (Recommended) 🎨
Build React UI for OpenAPI spec management:
- Spec upload component with drag-and-drop
- Specification browser with parsing status
- Generated node preview/visualization
- Integration with workflow canvas
- Drag generated nodes onto canvas
- Real-time parsing feedback

**Time Estimate:** 1-2 days  
**Priority:** High (makes the feature usable)

#### Phase 4: Workflow Execution Engine ⚙️
Enhance workflow execution with real API calls:
- Implement TRM Labs API client
- Implement Chainalysis API client
- Add rate limiting and retry logic
- Error handling and circuit breakers
- Execution progress tracking with WebSocket

**Time Estimate:** 2-3 days  
**Priority:** High (core functionality)

#### Phase 5: Output Nodes & Export 📊
Implement export functionality:
- PDF report generation with ReportLab
- Excel export with openpyxl
- CSV export
- JSON export
- Custom report templates

**Time Estimate:** 1-2 days  
**Priority:** Medium (needed for complete workflows)

#### Phase 6: Testing & Polish 🧪
Comprehensive testing and refinement:
- Integration tests for full workflow
- Load testing with large datasets
- UI/UX improvements
- Documentation
- Example workflows

**Time Estimate:** 1-2 days  
**Priority:** Medium (production readiness)

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
- ✅ **OpenAPI-driven architecture** (scalability) ✅
- ✅ **Dynamic configuration** (no hardcoded integrations) ✅

---

## 🎉 Recent Achievements

### December 19, 2025 - Phase 2 Complete ✅

Successfully implemented complete OpenAPI integration system:

**Parser Capabilities:**
- Parses OpenAPI 3.0+ (YAML/JSON)
- Extracts endpoints, parameters, schemas
- Validates specifications
- Error handling and logging

**Node Generation:**
- Automatic node creation from endpoints
- Type-safe input/output pin generation
- Configuration field extraction
- Provider-specific node categorization

**API & Admin:**
- Full CRUD operations
- File upload with validation
- Parse and generate actions
- Status tracking and error display

**Testing:**
- 100% unit test coverage
- Integration tests passing
- Sample specifications verified

**Ready for:** Frontend integration (Phase 3)

---

**Last Updated:** December 19, 2025  
**Version:** 0.2.0  
**Python:** 3.11+  
**Django:** 5.0.14  
**React:** 18.2 (Coming Soon)