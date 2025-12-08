# ==================== main.py ====================
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from PIL import Image
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

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
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    with open("static/index.html", "r") as f:
        return f.read()

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from uploaded image using Gemini API
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # Create prompt for text extraction
        prompt = """
        Extract all text from this image. 
        Please provide the text exactly as it appears in the image, maintaining the structure and formatting.
        If there is no text in the image, respond with "No text found in image."
        """
        
        # Generate response
        response = model.generate_content([prompt, image])
        
        # Extract text from response
        extracted_text = response.text
        
        return JSONResponse(content={
            "success": True,
            "extracted_text": extracted_text,
            "filename": file.filename
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}