"""Database configuration.""" 
from sqlalchemy import create_engine 
from sqlalchemy.ext.declarative import declarative_base 
from sqlalchemy.orm import sessionmaker 
from pathlib import Path 
 
DATABASE_PATH = Path(__file__).parent.parent / "database" / "blockchain_workflows.db" 
DATABASE_URL = f"sqlite:///{DATABASE_PATH}" 
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}) 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 
Base = declarative_base() 
