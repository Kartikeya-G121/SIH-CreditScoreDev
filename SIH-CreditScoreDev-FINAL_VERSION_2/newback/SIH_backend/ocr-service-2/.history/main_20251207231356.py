from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from PIL import Image
import io
import os
import traceback
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

logger.info(f"API Key loaded: {GEMINI_API_KEY[:10]}..." if GEMINI_API_KEY else "API Key NOT found!")

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY not found in environment variables")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    raise

# Initialize FastAPI app
app = FastAPI(title="Image Text Extractor", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    logger.info("Static files mounted successfully")
except Exception as e:
    logger.error(f"Failed to mount static files: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    try:
        with open("static/index.html", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.error(f"Failed to read index.html: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load page: {str(e)}")

@app.get("/test-api")
async def test_api():
    """Test if Gemini API is working"""
    try:
        logger.info("Testing Gemini API...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say 'API is working' if you can read this.")
        logger.info(f"API test successful: {response.text}")
        return {
            "status": "success", 
            "message": response.text,
            "api_key_preview": f"{GEMINI_API_KEY[:10]}..."
        }
    except Exception as e:
        logger.error(f"API test failed: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "status": "error", 
            "message": str(e),
            "traceback": traceback.format_exc()
        }

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded image using Gemini API"""
    logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
    
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image file
        logger.info("Reading image file...")
        contents = await file.read()
        logger.info(f"File size: {len(contents)} bytes")
        
        # Open image with PIL
        logger.info("Opening image with PIL...")
        image = Image.open(io.BytesIO(contents))
        logger.info(f"Image opened: {image.size}, mode: {image.mode}")
        
        # Convert to RGB if necessary
        if image.mode not in ['RGB', 'RGBA']:
            logger.info(f"Converting image from {image.mode} to RGB")
            image = image.convert('RGB')
        
        # Initialize Gemini model
        logger.info("Initializing Gemini model...")
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("Model initialized successfully")
        except Exception as model_error:
            logger.error(f"Model initialization failed: {str(model_error)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Model initialization failed: {str(model_error)}"
            )
        
        # Create prompt for text extraction
        prompt = "Extract all text from this image. Provide the text exactly as it appears, maintaining structure and formatting. If no text exists, say 'No text found'."
        
        # Generate response
        logger.info("Sending request to Gemini API...")
        try:
            response = model.generate_content([prompt, image])
            logger.info("Received response from Gemini API")
        except Exception as api_error:
            logger.error(f"Gemini API call failed: {str(api_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500, 
                detail=f"Gemini API error: {str(api_error)}"
            )
        
        # Check response
        logger.info(f"Response object: {response}")
        
        if not response:
            logger.error("Empty response from Gemini API")
            raise HTTPException(
                status_code=500, 
                detail="Received empty response from Gemini API"
            )
        
        # Check if response was blocked
        if hasattr(response, 'prompt_feedback'):
            logger.warning(f"Prompt feedback: {response.prompt_feedback}")
        
        # Extract text from response
        try:
            extracted_text = response.text
            logger.info(f"Successfully extracted text: {len(extracted_text)} characters")
        except ValueError as ve:
            logger.error(f"Failed to extract text from response: {str(ve)}")
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    logger.error(f"Finish reason: {candidate.finish_reason}")
                if hasattr(candidate, 'safety_ratings'):
                    logger.error(f"Safety ratings: {candidate.safety_ratings}")
            raise HTTPException(
                status_code=500,
                detail=f"Response blocked or invalid: {str(ve)}"
            )
        
        return JSONResponse(content={
            "success": True,
            "extracted_text": extracted_text,
            "filename": file.filename
        })
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Catch all other exceptions
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        logger.error(f"Unexpected error: {error_msg}")
        logger.error(error_trace)
        
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing image: {error_msg}\n\nTraceback:\n{error_trace}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api_key_configured": bool(GEMINI_API_KEY),
        "api_key_preview": f"{GEMINI_API_KEY[:10]}..." if GEMINI_API_KEY else "NOT SET"
    }

@app.get("/debug-env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    return {
        "GEMINI_API_KEY_set": bool(GEMINI_API_KEY),
        "GEMINI_API_KEY_length": len(GEMINI_API_KEY) if GEMINI_API_KEY else 0,
        "GEMINI_API_KEY_preview": f"{GEMINI_API_KEY[:10]}..." if GEMINI_API_KEY else "NOT SET",
        "env_file_exists": os.path.exists(".env"),
        "current_directory": os.getcwd(),
        "files_in_directory": os.listdir(".")
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)