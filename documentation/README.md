Below is a **clean, updated `README.md`** that:

* Keeps the README **user-facing and operational**
* Removes delivery / phase noise
* Explicitly **links to the System Implementation Plan**
* Avoids duplication
* Reflects the current state of EasyCall accurately



---

```markdown
# EasyCall – Blockchain Intelligence Workflow Builder

Visual, no-code workflow builder for blockchain intelligence queries with dynamic API provider management.

![Python](https://img.shields.io/badge/python-3.11+-blue)
![Django](https://img.shields.io/badge/django-5.0-green)
![React](https://img.shields.io/badge/react-18.2-61dafb)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 🎯 Overview

**EasyCall** converts complex blockchain intelligence API calls into a **visual, drag-and-drop workflow**, similar to Unreal Engine’s Blueprint system.

Investigators and analysts can build repeatable blockchain queries **without writing code**, while administrators can add or remove API providers dynamically using OpenAPI specifications.

**Target users**
- Blockchain investigators
- Compliance & AML analysts
- Fraud and intelligence teams

---

## ✨ Key Capabilities

- 🎨 Visual node-based workflow editor (React Flow)
- 🔗 Drag-and-drop workflow connections
- 🔌 **Dynamic provider system (OpenAPI-driven)**  
- 🤖 Automatic node generation from OpenAPI specs
- 🛠️ Admin UI for provider management
- 📊 TRM Labs & Chainalysis (spec-based)
- 📁 Batch processing (up to 10,000 addresses)
- 📤 Export results (CSV, JSON, Excel, TXT)
- 🔐 Encrypted API credential storage
- ⚡ Execution logging
- 🏠 Professional landing page with live stats

---

## 🏗️ High-Level Architecture

**Backend**
- Django 5 + Django REST Framework
- SQLite (portable by design)
- OpenAPI-driven provider integration

**Frontend**
- React 18 + TypeScript
- React Flow canvas
- Material-UI (Phase 3)

**Integration Model**
- Providers defined by OpenAPI spec files
- Nodes generated dynamically at runtime
- No hard-coded provider logic

---

## 📂 Project Structure (Simplified)

```

easycall/
├── backend/
│   ├── apps/
│   │   ├── integrations/     # OpenAPI provider system
│   │   ├── workflows/        # Workflow CRUD
│   │   ├── execution/        # Execution engine
│   │   ├── dashboard/        # Landing page + stats
│   │   └── nodes/            # Static node definitions
│   ├── templates/            # Django templates
│   ├── media/api_specs/      # Uploaded OpenAPI specs
│   └── manage.py
│
└── frontend/
└── src/
├── components/canvas/
├── hooks/
├── api/
└── types/

````

(See `documentation/` for full technical detail.)

---

## 🚀 Quick Start

### Requirements
- Python 3.11+
- Node.js 18+
- Git

### Windows
```bash
git clone <repo-url>
cd easycall
setup-windows.bat
start-application.bat
````

### Linux / macOS

```bash
git clone <repo-url>
cd easycall
chmod +x setup-linux.sh
./setup-linux.sh
./start-application.sh
```

### URLs

* **Landing page:** [http://localhost:8000/](http://localhost:8000/)
* **Admin:** [http://localhost:8000/admin/](http://localhost:8000/admin/)
* **API docs:** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
* **React frontend:** [http://localhost:3000/](http://localhost:3000/)

---

## 🔌 Adding a New API Provider (Admin Flow)

1. Go to Django Admin
   `http://localhost:8000/admin/integrations/openapispec/`

2. Upload an OpenAPI 3.x YAML or JSON file

3. Save → parse → generate

4. New nodes appear automatically in the canvas

**No backend or frontend code changes required.**

---

## 🧪 Testing & Development

### Backend

```bash
python manage.py test
python test_integration.py
flake8
```

### Frontend

```bash
npm test
npm run lint
```

---

## 🔒 Security Notes

* API keys encrypted at rest (Fernet)
* OpenAPI file uploads validated (type + size)
* Admin-only provider management
* HTTPS required in production
* No external spec fetching (upload-only)

---

## ⚠️ Known Limitations

* Swagger 2.0 support not yet implemented
* Workflow execution for database-generated nodes is still being finalised
* React admin UI for providers not yet implemented (Django Admin used)

---

## 🗺️ System Implementation Plan

Detailed delivery phases, risks, testing strategy, migration plan, and deployment approach are documented separately:

📄 **`documentation/Provider_Management_System_Implementation_Plan.md`**

(This README intentionally avoids phase-level detail.)

---

## 📚 Additional Documentation

* `documentation/RoadMap.md`
* `documentation/API Integration Specification2.md`

---

## 📄 License

Proprietary – internal use only.

---

## 🤝 Contributing

Internal development only:

1. Feature branches only
2. Black + Flake8 enforced
3. Tests required for new functionality
4. Update documentation when behaviour changes

---

**Version:** 0.3.0
**Last Updated:** December 2025

```

---

### Why this version is correct

- README now answers **what / how / where**
- Implementation plan handles **when / risk / rollout**
- No phase duplication
- Explicit doc links
- Short enough to read, detailed enough to trust

If you want, next we can:
- Refactor the **implementation plan** for executive vs technical audiences  
- Or create a **1-page README-lite** for funders / non-technical reviewers
```
