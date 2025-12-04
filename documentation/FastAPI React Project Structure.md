blockchain-intelligence-workflow/
│
├── README.md                           # Project overview and setup instructions
├── .gitignore                          # Git ignore rules
├── docker-compose.yml                  # Optional: for development
├── setup-windows.bat                   # Windows setup script
├── setup-linux.sh                      # Linux/Mac setup script
├── start-application.bat               # Launch script for Windows
├── start-application.sh                # Launch script for Linux/Mac
│
├── backend/                            # FastAPI Backend
│   ├── main.py                        # Application entry point
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Environment variables template
│   ├── .env                           # Environment variables (gitignored)
│   ├── pytest.ini                     # Test configuration
│   │
│   ├── application/                   # Application layer
│   │   ├── __init__.py
│   │   ├── api_server.py             # FastAPI app initialization
│   │   ├── config.py                 # Application configuration
│   │   ├── database.py               # Database connection and session
│   │   └── dependencies.py           # FastAPI dependencies
│   │
│   ├── api/                           # API Routes (Controllers)
│   │   ├── __init__.py
│   │   ├── workflows_routes.py       # Workflow CRUD endpoints
│   │   ├── execution_routes.py       # Workflow execution endpoints
│   │   ├── settings_routes.py        # Global settings endpoints
│   │   ├── files_routes.py           # File upload/download endpoints
│   │   ├── node_templates_routes.py  # Node type definitions endpoints
│   │   └── websocket_routes.py       # WebSocket for real-time logs
│   │
│   ├── models/                        # Database Models (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── workflow_model.py         # Workflow table
│   │   ├── execution_log_model.py    # Execution logs table
│   │   ├── execution_result_model.py # Execution results table
│   │   ├── global_settings_model.py  # Global settings table (singleton)
│   │   └── uploaded_file_model.py    # Uploaded files table
│   │
│   ├── schemas/                       # Pydantic Schemas (Request/Response)
│   │   ├── __init__.py
│   │   ├── workflow_schemas.py       # Workflow request/response models
│   │   ├── execution_schemas.py      # Execution request/response models
│   │   ├── settings_schemas.py       # Settings request/response models
│   │   ├── file_schemas.py           # File request/response models
│   │   └── node_schemas.py           # Node configuration schemas
│   │
│   ├── services/                      # Business Logic Layer
│   │   ├── __init__.py
│   │   ├── workflow_service.py       # Workflow management logic
│   │   ├── execution_service.py      # Workflow execution orchestration
│   │   ├── file_service.py           # File processing logic
│   │   └── settings_service.py       # Settings management logic
│   │
│   ├── workflow_engine/               # Workflow Execution Engine
│   │   ├── __init__.py
│   │   ├── executor.py               # Main execution orchestrator
│   │   ├── context.py                # Execution context (data passing)
│   │   ├── validator.py              # Workflow validation
│   │   ├── node_result.py            # Node execution result model
│   │   └── rate_limiter.py           # Rate limiting for API calls
│   │
│   ├── nodes/                         # Node Type Implementations
│   │   ├── __init__.py
│   │   ├── base_node.py              # Abstract base node class
│   │   ├── node_registry.py          # Registry of all node types
│   │   │
│   │   ├── configuration_nodes/       # Configuration nodes
│   │   │   ├── __init__.py
│   │   │   ├── chainalysis_credentials_node.py
│   │   │   └── trm_credentials_node.py
│   │   │
│   │   ├── input_nodes/               # Input nodes
│   │   │   ├── __init__.py
│   │   │   ├── single_address_node.py
│   │   │   ├── batch_input_node.py
│   │   │   └── transaction_hash_node.py
│   │   │
│   │   ├── query_nodes_chainalysis/   # Chainalysis query nodes
│   │   │   ├── __init__.py
│   │   │   ├── cluster_info_node.py
│   │   │   ├── cluster_balance_node.py
│   │   │   ├── cluster_counterparties_node.py
│   │   │   ├── transaction_details_node.py
│   │   │   ├── exposure_category_node.py
│   │   │   └── exposure_service_node.py
│   │   │
│   │   ├── query_nodes_trm/           # TRM Labs query nodes
│   │   │   ├── __init__.py
│   │   │   ├── address_attribution_node.py
│   │   │   ├── total_exposure_node.py
│   │   │   ├── address_summary_node.py
│   │   │   ├── address_transfers_node.py
│   │   │   └── network_intelligence_node.py
│   │   │
│   │   └── output_nodes/              # Output nodes
│   │       ├── __init__.py
│   │       ├── txt_export_node.py
│   │       ├── excel_export_node.py
│   │       ├── json_export_node.py
│   │       ├── csv_export_node.py
│   │       └── console_log_node.py
│   │
│   ├── api_clients/                   # External API Client Integrations
│   │   ├── __init__.py
│   │   ├── base_api_client.py        # Base client with common functionality
│   │   ├── chainalysis_api_client.py # Chainalysis Reactor API client
│   │   └── trm_api_client.py         # TRM Labs API client
│   │
│   ├── file_parsers/                  # File Processing
│   │   ├── __init__.py
│   │   ├── csv_parser.py             # Parse CSV files
│   │   ├── excel_parser.py           # Parse Excel files
│   │   ├── pdf_parser.py             # Parse PDF files
│   │   └── word_parser.py            # Parse Word documents
│   │
│   ├── utilities/                     # Utility Functions
│   │   ├── __init__.py
│   │   ├── encryption_utility.py     # API key encryption/decryption
│   │   ├── validation_utility.py     # Address validation
│   │   ├── logging_utility.py        # Logging configuration
│   │   └── exceptions.py             # Custom exception classes
│   │
│   ├── storage/                       # File Storage
│   │   ├── uploads/                  # User uploaded files (gitignored)
│   │   └── exports/                  # Generated export files (gitignored)
│   │
│   ├── database/                      # Database Files
│   │   └── blockchain_workflows.db   # SQLite database (gitignored)
│   │
│   └── tests/                         # Backend Tests
│       ├── __init__.py
│       ├── conftest.py               # Pytest fixtures
│       ├── test_api/                 # API endpoint tests
│       │   ├── test_workflows_api.py
│       │   ├── test_execution_api.py
│       │   └── test_settings_api.py
│       ├── test_services/            # Service layer tests
│       │   ├── test_workflow_service.py
│       │   └── test_execution_service.py
│       ├── test_nodes/               # Node execution tests
│       │   ├── test_input_nodes.py
│       │   ├── test_query_nodes_trm.py
│       │   └── test_output_nodes.py
│       └── test_utilities/           # Utility tests
│           └── test_validation.py
│
├── frontend/                          # React Frontend
│   ├── package.json                  # Node dependencies
│   ├── package-lock.json             # Dependency lock file
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── .env.example                  # Environment variables template
│   ├── .env                          # Environment variables (gitignored)
│   ├── .gitignore                    # Frontend-specific gitignore
│   │
│   ├── public/                       # Static Assets
│   │   ├── index.html               # HTML template
│   │   ├── favicon.ico              # Application icon
│   │   └── manifest.json            # PWA manifest
│   │
│   └── src/                          # Source Code
│       ├── index.tsx                # Application entry point
│       ├── App.tsx                  # Root component
│       ├── theme.ts                 # Material-UI theme configuration
│       ├── routes.tsx               # Application routing
│       │
│       ├── api/                     # API Client Layer
│       │   ├── api_client.ts       # Axios instance configuration
│       │   ├── workflow_api.ts     # Workflow API calls
│       │   ├── execution_api.ts    # Execution API calls
│       │   ├── settings_api.ts     # Settings API calls
│       │   ├── files_api.ts        # File upload/download API calls
│       │   └── node_templates_api.ts # Node templates API calls
│       │
│       ├── components/              # React Components
│       │   │
│       │   ├── layout/              # Layout Components
│       │   │   ├── NavigationBar.tsx
│       │   │   ├── MainLayout.tsx
│       │   │   └── OutputPanel.tsx
│       │   │
│       │   ├── canvas/              # Canvas Components
│       │   │   ├── WorkflowCanvas.tsx      # Main React Flow canvas
│       │   │   ├── NodePalette.tsx         # Draggable node library
│       │   │   ├── CanvasControls.tsx      # Zoom, pan, fit controls
│       │   │   └── CanvasMiniMap.tsx       # Miniature overview
│       │   │
│       │   ├── nodes/               # Custom Node Components
│       │   │   ├── BaseNode.tsx             # Base node wrapper
│       │   │   ├── NodeFactory.tsx          # Dynamic node creation
│       │   │   │
│       │   │   ├── configuration_nodes/     # Configuration node components
│       │   │   │   ├── ChainalysisCredentialsNode.tsx
│       │   │   │   └── TrmCredentialsNode.tsx
│       │   │   │
│       │   │   ├── input_nodes/             # Input node components
│       │   │   │   ├── SingleAddressNode.tsx
│       │   │   │   ├── BatchInputNode.tsx
│       │   │   │   └── TransactionHashNode.tsx
│       │   │   │
│       │   │   ├── query_nodes_chainalysis/ # Chainalysis query nodes
│       │   │   │   ├── ClusterInfoNode.tsx
│       │   │   │   ├── ClusterBalanceNode.tsx
│       │   │   │   ├── ClusterCounterpartiesNode.tsx
│       │   │   │   ├── TransactionDetailsNode.tsx
│       │   │   │   ├── ExposureCategoryNode.tsx
│       │   │   │   └── ExposureServiceNode.tsx
│       │   │   │
│       │   │   ├── query_nodes_trm/         # TRM query nodes
│       │   │   │   ├── AddressAttributionNode.tsx
│       │   │   │   ├── TotalExposureNode.tsx
│       │   │   │   ├── AddressSummaryNode.tsx
│       │   │   │   ├── AddressTransfersNode.tsx
│       │   │   │   └── NetworkIntelligenceNode.tsx
│       │   │   │
│       │   │   └── output_nodes/            # Output node components
│       │   │       ├── TxtExportNode.tsx
│       │   │       ├── ExcelExportNode.tsx
│       │   │       ├── JsonExportNode.tsx
│       │   │       ├── CsvExportNode.tsx
│       │   │       └── ConsoleLogNode.tsx
│       │   │
│       │   ├── dialogs/             # Dialog Components
│       │   │   ├── SaveWorkflowDialog.tsx
│       │   │   ├── LoadWorkflowDialog.tsx
│       │   │   ├── DeleteWorkflowDialog.tsx
│       │   │   ├── SettingsDialog.tsx
│       │   │   ├── NodeConfigurationDialog.tsx
│       │   │   └── ConfirmDialog.tsx
│       │   │
│       │   ├── output/              # Output Display Components
│       │   │   ├── LogViewer.tsx           # Real-time execution logs
│       │   │   ├── ResultsViewer.tsx       # Structured results display
│       │   │   └── FileDownloadsList.tsx   # Download links for exports
│       │   │
│       │   └── common/              # Reusable Components
│       │       ├── LoadingSpinner.tsx
│       │       ├── ErrorMessage.tsx
│       │       ├── SuccessMessage.tsx
│       │       └── EmptyState.tsx
│       │
│       ├── hooks/                   # Custom React Hooks
│       │   ├── useWorkflow.ts              # Workflow state management
│       │   ├── useExecution.ts             # Execution state management
│       │   ├── useWebSocket.ts             # WebSocket connection
│       │   ├── useSettings.ts              # Settings state management
│       │   ├── useFileUpload.ts            # File upload handling
│       │   └── useNodeSelection.ts         # Node selection state
│       │
│       ├── types/                   # TypeScript Type Definitions
│       │   ├── workflow_types.ts           # Workflow-related types
│       │   ├── node_types.ts               # Node type definitions
│       │   ├── execution_types.ts          # Execution-related types
│       │   ├── settings_types.ts           # Settings types
│       │   ├── api_types.ts                # API response types
│       │   └── common_types.ts             # Shared types
│       │
│       ├── utilities/               # Utility Functions
│       │   ├── validation_utility.ts       # Client-side validation
│       │   ├── formatting_utility.ts       # Data formatting
│       │   ├── date_utility.ts             # Date/time formatting
│       │   ├── constants.ts                # Application constants
│       │   └── node_registry.ts            # Node type registry
│       │
│       ├── styles/                  # Global Styles
│       │   ├── global.css                  # Global CSS
│       │   ├── canvas.css                  # Canvas-specific styles
│       │   └── nodes.css                   # Node-specific styles
│       │
│       └── tests/                   # Frontend Tests
│           ├── components/
│           │   ├── WorkflowCanvas.test.tsx
│           │   └── NodePalette.test.tsx
│           ├── hooks/
│           │   └── useWorkflow.test.ts
│           └── utilities/
│               └── validation.test.ts
│
└── documentation/                   # Project Documentation
    ├── api_documentation.md        # API endpoint reference
    ├── node_specifications.md      # Complete node specifications
    ├── development_guide.md        # Development setup and guidelines
    ├── deployment_guide.md         # Deployment instructions
    └── user_manual.md              # End-user documentation







File Naming Conventions
Backend (Python)

Files: snake_case_with_descriptive_names.py
Classes: PascalCase (e.g., WorkflowService, AddressAttributionNode)
Functions: snake_case (e.g., execute_workflow, validate_address)
Constants: UPPER_SNAKE_CASE (e.g., MAX_BATCH_SIZE, API_TIMEOUT)

Frontend (TypeScript/React)

Components: PascalCase.tsx (e.g., WorkflowCanvas.tsx, SaveWorkflowDialog.tsx)
Utilities: camelCase.ts (e.g., validationUtility.ts, formattingUtility.ts)
Types: snake_case_types.ts (e.g., workflow_types.ts, node_types.ts)
Hooks: useCamelCase.ts (e.g., useWorkflow.ts, useExecution.ts)
CSS: kebab-case.css (e.g., global.css, canvas.css)




# backend/main.py
"""
Application entry point.
Starts the FastAPI server.
"""

import uvicorn
from application.api_server import create_application

if __name__ == "__main__":
    app = create_application()
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True,  # Auto-reload during development
        log_level="info"
    )




# backend/application/api_server.py
"""
FastAPI application initialization and configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import (
    workflows_routes,
    execution_routes,
    settings_routes,
    files_routes,
    node_templates_routes,
    websocket_routes
)

def create_application() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="Blockchain Intelligence Workflow Builder API",
        description="API for visual blockchain intelligence workflows",
        version="1.0.0"
    )
    
    # CORS middleware for React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register API routes
    app.include_router(workflows_routes.router, prefix="/api/workflows", tags=["Workflows"])
    app.include_router(execution_routes.router, prefix="/api/execution", tags=["Execution"])
    app.include_router(settings_routes.router, prefix="/api/settings", tags=["Settings"])
    app.include_router(files_routes.router, prefix="/api/files", tags=["Files"])
    app.include_router(node_templates_routes.router, prefix="/api/node-templates", tags=["Node Templates"])
    app.include_router(websocket_routes.router, prefix="/ws", tags=["WebSocket"])
    
    @app.get("/")
    def root():
        return {"message": "Blockchain Intelligence Workflow Builder API"}
    
    @app.get("/health")
    def health_check():
        return {"status": "healthy"}
    
    return app






# backend/application/database.py
"""
Database connection and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# Database file path (relative to project root)
DATABASE_PATH = Path(__file__).parent.parent / "database" / "blockchain_workflows.db"
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

# SQLite connection string
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_database_session():
    """
    Dependency for getting database session.
    Use with FastAPI Depends().
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_all_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)



# backend/nodes/node_registry.py
"""
Registry of all available node types.
Maps node type strings to node classes.
"""

from typing import Dict, Type
from nodes.base_node import BaseNode

# Import all node implementations
from nodes.configuration_nodes.chainalysis_credentials_node import ChainalysisCredentialsNode
from nodes.configuration_nodes.trm_credentials_node import TrmCredentialsNode
from nodes.input_nodes.single_address_node import SingleAddressNode
from nodes.input_nodes.batch_input_node import BatchInputNode
from nodes.query_nodes_trm.address_attribution_node import AddressAttributionNode
from nodes.query_nodes_trm.total_exposure_node import TotalExposureNode
from nodes.output_nodes.excel_export_node import ExcelExportNode
from nodes.output_nodes.json_export_node import JsonExportNode
# ... import all other nodes

# Node registry mapping
NODE_REGISTRY: Dict[str, Type[BaseNode]] = {
    # Configuration Nodes
    "credential_chainalysis": ChainalysisCredentialsNode,
    "credential_trm": TrmCredentialsNode,
    
    # Input Nodes
    "single_address": SingleAddressNode,
    "batch_input": BatchInputNode,
    "transaction_hash": TransactionHashNode,
    
    # Chainalysis Query Nodes
    "chainalysis_cluster_info": ClusterInfoNode,
    "chainalysis_cluster_balance": ClusterBalanceNode,
    # ... all Chainalysis nodes
    
    # TRM Query Nodes
    "trm_address_attribution": AddressAttributionNode,
    "trm_total_exposure": TotalExposureNode,
    # ... all TRM nodes
    
    # Output Nodes
    "txt_export": TxtExportNode,
    "excel_export": ExcelExportNode,
    "json_export": JsonExportNode,
    "csv_export": CsvExportNode,
    "console_log": ConsoleLogNode,
}

def get_node_class(node_type: str) -> Type[BaseNode]:
    """
    Get node class by type.
    
    Args:
        node_type: Node type identifier
        
    Returns:
        Node class
        
    Raises:
        ValueError: If node type not found
    """
    if node_type not in NODE_REGISTRY:
        raise ValueError(f"Unknown node type: {node_type}")
    
    return NODE_REGISTRY[node_type]

def get_all_node_types() -> list[str]:
    """Get list of all registered node types."""
    return list(NODE_REGISTRY.keys())








// frontend/src/index.tsx
/**
 * Application entry point.
 * Renders the React application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);








// frontend/src/App.tsx
/**
 * Root application component.
 * Contains main layout and routing.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import WorkflowCanvas from './components/canvas/WorkflowCanvas';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <WorkflowCanvas />
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;










@echo off
REM start-application.bat
REM Launches both backend and frontend servers

echo ========================================
echo Blockchain Intelligence Workflow Builder
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start cmd /k "python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py"

echo Waiting for backend to start...
timeout /t 5

echo Starting Frontend Server...
cd ..\frontend
start cmd /k "npm install && npm start"

echo.
echo ========================================
echo Application is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================










#!/bin/bash
# start-application.sh
# Launches both backend and frontend servers

echo "========================================"
echo "Blockchain Intelligence Workflow Builder"
echo "========================================"
echo ""

echo "Starting Backend Server..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting Frontend Server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Application is running..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID








# backend/requirements.txt

# FastAPI and Server
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
alembic==1.13.1

# API Clients
requests==2.31.0
aiohttp==3.9.1

# File Processing
openpyxl==3.1.2          # Excel
pandas==2.1.4            # Data manipulation
PyPDF2==3.0.1            # PDF parsing
python-docx==1.1.0       # Word documents

# Security
cryptography==42.0.0     # API key encryption
python-dotenv==1.0.0     # Environment variables

# WebSocket
websockets==12.0

# Utilities
python-dateutil==2.8.2
pydantic==2.5.3
pydantic-settings==2.1.0

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
flake8==7.0.0
black==23.12.1



{
  "name": "blockchain-intelligence-workflow-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^5.3.3",
    
    "@mui/material": "^5.15.3",
    "@mui/icons-material": "^5.15.3",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    
    "reactflow": "^11.10.4",
    
    "axios": "^1.6.5",
    "react-router-dom": "^6.21.1",
    
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@types/node": "^20.10.6",
    
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}






# backend/.env.example

# Application
APP_NAME=Blockchain Intelligence Workflow Builder
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_PATH=database/blockchain_workflows.db

# API Keys (leave empty, set in UI)
CHAINALYSIS_API_KEY=
CHAINALYSIS_API_URL=https://iapi.chainalysis.com

TRM_API_KEY=
TRM_API_URL=https://api.trmlabs.com

# Encryption
ENCRYPTION_KEY=generate-with-cryptography-fernet-generate_key

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/application.log

# Server
HOST=127.0.0.1
PORT=8000









# frontend/.env.example

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_BASE_URL=ws://localhost:8000/ws

# Application
REACT_APP_NAME=Blockchain Intelligence Workflow Builder
REACT_APP_VERSION=1.0.0















