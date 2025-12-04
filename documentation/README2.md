# =============================================================================
# FILE: easycall/README.md
# =============================================================================

# EasyCall - Blockchain Intelligence Workflow Builder

A visual, no-code workflow builder that enables non-technical users to create
complex blockchain intelligence queries by connecting nodes on a canvas.

## Project Overview

- **Purpose**: Transform complex API interactions with Chainalysis Reactor and
  TRM Labs into a visual, drag-and-drop interface
- **Target Users**: Blockchain analysts, compliance officers, fraud investigators
- **Architecture**: Django REST API backend with React + React Flow frontend

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ LTS
- Visual Studio Code (recommended)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
easycall/
├── backend/                 # Django REST API
│   ├── config/             # Django settings and configuration
│   ├── apps/               # Django applications
│   │   ├── core/           # Core utilities and base classes
│   │   ├── workflows/      # Workflow management
│   │   ├── execution/      # Workflow execution engine
│   │   ├── nodes/          # Node type definitions
│   │   ├── integrations/   # External API clients
│   │   └── settings_manager/ # Global settings management
│   ├── fields/             # Centralized field definitions
│   ├── utils/              # Shared utilities
│   ├── media/              # Uploads and exports
│   └── logs/               # Application logs
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── nodes/          # Custom React Flow nodes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── public/
│
├── docs/                   # Project documentation
└── .vscode/               # VSCode configuration
```

## Key Features

- Visual node-based workflow builder (similar to Unreal Engine Blueprints)
- Support for Chainalysis Reactor and TRM Labs APIs
- Batch processing up to 10,000 addresses
- Multiple export formats (TXT, Excel, JSON, CSV)
- Portable SQLite database for USB stick deployment
- Real-time execution logging via WebSocket

## Development Standards

- **Linting**: Flake8 with strict configuration
- **Formatting**: Black code formatter
- **Documentation**: Comprehensive docstrings and type annotations
- **Testing**: pytest with high coverage requirements
- **Logging**: Structured logging throughout

## License

Proprietary - All rights reserved

## Version

0.1.0 (Development)