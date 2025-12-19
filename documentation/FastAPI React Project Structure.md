# EasyCall - Blockchain Intelligence Workflow Builder

## Project Overview

**EasyCall** is a no-code visual workflow builder designed for blockchain compliance teams and investigators. It provides a drag-and-drop canvas interface to create automated blockchain intelligence workflows without writing code.

### What It's Used For

- **Compliance Analysis**: Automate KYC/AML checks on blockchain addresses
- **Forensic Investigation**: Trace transaction flows and identify counterparties
- **Risk Assessment**: Evaluate exposure to high-risk entities and services
- **Batch Processing**: Process hundreds of addresses from uploaded files
- **Report Generation**: Generate professional PDF reports for stakeholders

### Key Features

- Visual workflow canvas with 24 node types
- Integration with Chainalysis Reactor IAPI and TRM Labs APIs
- Batch processing from CSV, Excel, PDF, and Word documents
- Multiple export formats (PDF, Excel, CSV, JSON, TXT)
- Real-time execution logging
- File-based workflow save/load

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend Framework | Django 5.0 with Django REST Framework |
| Frontend Framework | React 18 with TypeScript |
| Canvas Library | React Flow |
| UI Components | Material-UI (MUI) |
| Database | SQLite (portable) |
| PDF Generation | ReportLab (programmatic) |
| API Documentation | DRF Spectacular (OpenAPI) |

---

## Project Structure

```
EasyCall/
├── backend/                          # Django Backend
│   ├── config/                       # Django configuration
│   │   ├── settings.py              # Main settings file
│   │   ├── urls.py                  # Root URL configuration
│   │   └── wsgi.py                  # WSGI entry point
│   │
│   ├── apps/                        # Django applications
│   │   ├── core/                    # Base models and utilities
│   │   │   ├── models.py           # TimeStampedModel, UUIDModel
│   │   │   └── exceptions.py       # Custom exception handler
│   │   │
│   │   ├── workflows/              # Workflow management
│   │   │   ├── models.py           # Workflow model
│   │   │   ├── views.py            # API endpoints
│   │   │   ├── serializers.py      # DRF serializers
│   │   │   └── urls.py             # URL routing
│   │   │
│   │   ├── execution/              # Workflow execution
│   │   │   ├── models.py           # ExecutionLog model
│   │   │   ├── executor.py         # WorkflowExecutor engine
│   │   │   ├── report_generator.py # PDF report generation
│   │   │   └── templates/          # HTML templates for reports
│   │   │
│   │   ├── integrations/           # External API clients
│   │   │   ├── chainalysis_client.py
│   │   │   └── trm_client.py
│   │   │
│   │   ├── nodes/                  # Node type definitions
│   │   │   └── query_nodes_chainalysis/
│   │   │
│   │   └── settings_manager/       # Global settings
│   │
│   ├── outputs/                    # Generated export files
│   ├── requirements.txt            # Python dependencies
│   └── manage.py                   # Django management script
│
├── frontend/                        # React Frontend
│   ├── src/
│   │   ├── App.tsx                 # Root component
│   │   ├── index.tsx               # Entry point
│   │   │
│   │   ├── api/                    # API communication
│   │   │   ├── api_client.ts       # Axios configuration
│   │   │   └── workflow_api.ts     # Workflow API calls
│   │   │
│   │   ├── components/
│   │   │   ├── canvas/             # Canvas components
│   │   │   │   ├── WorkflowCanvas.tsx
│   │   │   │   └── NodePalette.tsx
│   │   │   │
│   │   │   ├── nodes/              # Node components
│   │   │   │   ├── BaseNode.tsx    # UE5-style node
│   │   │   │   └── UE5Node.tsx
│   │   │   │
│   │   │   └── layout/             # Layout components
│   │   │       ├── MainLayout.tsx
│   │   │       └── OutputPanel.tsx
│   │   │
│   │   ├── types/                  # TypeScript definitions
│   │   │   ├── node_types.ts       # Node specifications
│   │   │   └── workflow_types.ts
│   │   │
│   │   └── hooks/                  # Custom React hooks
│   │       └── useWorkflow.ts
│   │
│   └── package.json                # Node dependencies
│
└── documentation/                   # Project documentation
```

---

## API Specification

### Base URL
```
Development: http://localhost:8000/api/v1/
```

### Authentication
Currently uses API keys stored in environment variables. API keys for Chainalysis and TRM Labs are configured via credential nodes in workflows.

### Endpoints

#### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows/` | List all workflows |
| POST | `/workflows/` | Create new workflow |
| GET | `/workflows/{uuid}/` | Get workflow details |
| PUT | `/workflows/{uuid}/` | Update workflow |
| PATCH | `/workflows/{uuid}/` | Partial update |
| DELETE | `/workflows/{uuid}/` | Soft delete workflow |

#### Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workflows/{uuid}/execute/` | Execute saved workflow |
| POST | `/workflows/execute_direct/` | Execute unsaved workflow |

### Request/Response Examples

#### Create Workflow
```http
POST /api/v1/workflows/
Content-Type: application/json

{
  "name": "Address Analysis",
  "description": "Analyze Bitcoin address exposure",
  "canvas_data": {
    "nodes": [...],
    "edges": [...],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

#### Execute Workflow
```http
POST /api/v1/workflows/execute_direct/
Content-Type: application/json

{
  "name": "Quick Analysis",
  "nodes": [
    {
      "id": "node-1",
      "type": "single_address",
      "data": {
        "config": {
          "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          "blockchain": "bitcoin"
        }
      }
    },
    ...
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "address",
      "targetHandle": "address"
    }
  ]
}
```

#### Execution Response
```json
{
  "status": "success",
  "log": [
    "══════════════════════════════════════════════════════════════",
    "🚀 WORKFLOW EXECUTION STARTED",
    "📋 Workflow: Quick Analysis",
    "⏰ Started at: 2024-12-18 10:30:00",
    "══════════════════════════════════════════════════════════════",
    "🔷 Executing: single_address (node-1)",
    "  ✅ Node completed successfully",
    "..."
  ],
  "outputs": {
    "node-1": {
      "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "blockchain": "bitcoin"
    },
    ...
  },
  "summary": {
    "nodes_executed": 5,
    "status": "COMPLETED"
  }
}
```

---

## Node System

### How Nodes Work

Nodes are the building blocks of workflows. Each node:
1. Has **inputs** (connection points that receive data)
2. Has **outputs** (connection points that provide data)
3. Has **configuration** (settings that control behavior)
4. Belongs to a **category** (Configuration, Input, Query, or Output)

### Data Types

| Type | Description |
|------|-------------|
| `ADDRESS` | Single blockchain address |
| `ADDRESS_LIST` | Array of addresses |
| `TRANSACTION` | Transaction hash |
| `TRANSACTION_LIST` | Array of transaction hashes |
| `CREDENTIALS` | API credentials object |
| `JSON_DATA` | Arbitrary JSON object |
| `STRING` | Text value |
| `NUMBER` | Numeric value |
| `BOOLEAN` | True/false value |
| `ANY` | Accepts any data type |

### Node Categories

#### 1. Configuration Nodes (Purple - #4a148c)

| Node Type | Purpose | Outputs |
|-----------|---------|---------|
| `credential_chainalysis` | Store Chainalysis API key | `credentials` |
| `credential_trm` | Store TRM Labs API key | `credentials` |

#### 2. Input Nodes (Blue - #1976d2)

| Node Type | Purpose | Outputs |
|-----------|---------|---------|
| `single_address` | Single address input | `address`, `blockchain` |
| `batch_input` | Batch addresses from file | `addresses`, `count`, `blockchain` |
| `transaction_hash` | Single transaction hash | `tx_hash`, `blockchain` |
| `batch_transaction` | Batch transactions from file | `tx_hashes`, `count`, `blockchain` |

#### 3. Query Nodes - Chainalysis (Teal - #00897b)

| Node Type | Purpose | Key Outputs |
|-----------|---------|-------------|
| `chainalysis_cluster_info` | Get cluster attribution | `cluster_name`, `category` |
| `chainalysis_cluster_balance` | Get balance data | `balance`, `total_sent`, `total_received` |
| `chainalysis_cluster_counterparties` | Get counterparties | `counterparties`, `count` |
| `chainalysis_transaction_details` | Get transaction info | `transaction_details`, `inputs`, `outputs` |
| `chainalysis_exposure_category` | Category-based exposure | `direct_exposure`, `indirect_exposure` |
| `chainalysis_exposure_service` | Service-based exposure | `service_count` |

#### 4. Query Nodes - TRM Labs (Teal - #00897b)

| Node Type | Purpose | Key Outputs |
|-----------|---------|-------------|
| `trm_address_attribution` | Get entity attribution | `entities`, `entity_count` |
| `trm_total_exposure` | Get risk exposure | `exposures`, `high_risk_entities` |
| `trm_address_summary` | Address metrics | `metrics` |
| `trm_address_transfers` | Transfer history | `transfers`, `transfer_count` |
| `trm_network_intelligence` | Network data | `ip_data` |

#### 5. Output Nodes (Orange - #f57c00)

| Node Type | Purpose | Configuration |
|-----------|---------|---------------|
| `pdf_export` | Generate PDF report | `report_title`, `render_engine` |
| `csv_export` | Export to CSV | `filename` |
| `excel_export` | Export to Excel | `sheet_name` |
| `json_export` | Export to JSON | `pretty_print` |
| `txt_export` | Export to text | `filename` |
| `console_log` | Log to console | `label`, `format` |
| `output_path` | Specify output path | `output_path` |

### Creating New Nodes

Nodes are defined in two places:

#### 1. Frontend Definition (`frontend/src/types/node_types.ts`)

```typescript
export const NODE_TYPES: Record<string, NodeTypeDefinition> = {
  // Example: New query node
  my_custom_node: {
    type: 'my_custom_node',
    name: 'My Custom Node',
    category: 'query',
    description: 'Does something custom',
    inputs: [
      { id: 'address', label: 'Address', type: DataType.ADDRESS, required: true },
    ],
    outputs: [
      { id: 'result', label: 'Result', type: DataType.JSON_DATA },
    ],
    config: [
      { id: 'option', label: 'Option', type: 'select', required: true,
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]
      },
    ],
  },
};
```

#### 2. Backend Handler (`backend/apps/execution/executor.py`)

```python
# In _run_node method, add case for new node type:
if node_type == 'my_custom_node':
    address = inputs.get('address')
    option = config.get('option', 'a')

    # Call your API or logic
    result = self._my_custom_logic(address, option)

    return {'result': result}
```

#### 3. Register in Canvas (`frontend/src/components/canvas/WorkflowCanvas.tsx`)

```typescript
const customNodeTypes: NodeTypes = {
  // ... existing nodes
  my_custom_node: BaseNode,
};
```

---

## Workflow Execution

### Execution Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  External   │
│   Canvas    │     │   Executor  │     │    APIs     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │  1. User clicks   │                   │
       │     "Execute"     │                   │
       │──────────────────▶│                   │
       │                   │  2. Topological   │
       │                   │     sort nodes    │
       │                   │                   │
       │                   │  3. Execute each  │
       │                   │     node in order │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │  4. API responses │
       │                   │◀──────────────────│
       │                   │                   │
       │  5. Results +     │                   │
       │     execution log │                   │
       │◀──────────────────│                   │
```

### WorkflowExecutor Class

The `WorkflowExecutor` in `backend/apps/execution/executor.py` handles:

1. **Topological Sorting**: Determines node execution order based on connections
2. **Input Resolution**: Maps node outputs to connected node inputs
3. **Node Execution**: Runs each node type with appropriate logic
4. **Context Management**: Tracks all node outputs for downstream nodes
5. **Error Handling**: Catches and logs errors per node
6. **Export Generation**: Creates output files (PDF, CSV, etc.)

---

## External API Integration

### Chainalysis Reactor IAPI

**Base URL**: `https://iapi.chainalysis.com`

**Authentication**: Token header
```python
headers = {"Token": api_key}
```

**Endpoints Used**:
| Endpoint | Purpose |
|----------|---------|
| `/clusters/{address}` | Get cluster info |
| `/clusters/{address}/summary` | Get balance summary |
| `/clusters/{address}/counterparties` | Get counterparties |
| `/transactions/{hash}` | Get transaction details |
| `/exposures/{address}/categories` | Get category exposure |
| `/exposures/{address}/services` | Get service exposure |

### TRM Labs API

**Base URL**: `https://api.trmlabs.com`

**Authentication**: Basic auth
```python
auth = (api_key, "")
```

**Endpoints Used**:
| Endpoint | Purpose |
|----------|---------|
| `/v1/addresses/{address}/attribution` | Entity attribution |
| `/v1/addresses/{address}/exposure` | Risk exposure |
| `/v1/addresses/{address}/summary` | Address metrics |
| `/v1/addresses/{address}/transfers` | Transfer history |

---

## Future Enhancements

### Planned Features

1. **Additional API Integrations**
   - Elliptic API support
   - Merkle Science integration
   - Custom webhook nodes

2. **Advanced Workflow Features**
   - Conditional branching (if/else nodes)
   - Loop nodes for iteration
   - Parallel execution paths
   - Scheduled workflow runs
   - Workflow templates library

3. **User Experience**
   - User authentication and workspaces
   - Workflow sharing and collaboration
   - Version control for workflows
   - Undo/redo functionality
   - Keyboard shortcuts

4. **Data Processing**
   - Data transformation nodes
   - Aggregation nodes (sum, average, group)
   - Filter and sort nodes
   - Custom JavaScript/Python expression nodes

5. **Reporting**
   - Customizable report templates
   - Interactive HTML reports
   - Dashboard with execution analytics
   - Email notification on completion

6. **Enterprise Features**
   - Multi-user support with roles
   - Audit logging
   - API rate limiting dashboard
   - Encrypted credential storage
   - SAML/SSO integration

### Technical Improvements

1. **Performance**
   - Caching for repeated API calls
   - Async execution with WebSocket progress
   - Batch API requests optimization

2. **Reliability**
   - Retry logic with exponential backoff
   - Circuit breaker for failing APIs
   - Execution checkpointing/resume

3. **Developer Experience**
   - Plugin system for custom nodes
   - Node SDK for third-party development
   - OpenAPI schema validation
   - Comprehensive test coverage

---

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables

**Backend (.env)**:
```env
SECRET_KEY=your-secret-key
DEBUG=True
CHAINALYSIS_API_KEY=your-key
TRM_API_KEY=your-key
```

**Frontend (.env)**:
```env
REACT_APP_API_URL=http://localhost:8000
```

---

## File Naming Conventions

### Backend (Python)
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

### Frontend (TypeScript)
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `snake_case_types.ts`
- Hooks: `useCamelCase.ts`
- CSS: `kebab-case.css`

---

## License

Proprietary - All rights reserved.

---

*Last Updated: December 2024*
