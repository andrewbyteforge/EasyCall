"""Application entry point.""" 
import uvicorn 
from application.api_server import create_application 
 
if __name__ == "__main__": 
    app = create_application() 
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True) 
