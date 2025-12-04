"""FastAPI application initialization.""" 
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
 
def create_application() -> FastAPI: 
    app = FastAPI(title="Blockchain Intelligence Workflow Builder API") 
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]) 
    return app 
