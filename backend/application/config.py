"""Application configuration.""" 
from pydantic_settings import BaseSettings 
 
class Settings(BaseSettings): 
    app_name: str = "Blockchain Intelligence Workflow Builder" 
    debug: bool = True 
