from fastapi import FastAPI, File, UploadFile, Form, HTTPException
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
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key="AIzaSyAuWY1tZBi227NIxjXGEUw186iOJB-6G4w")

# Initialize FastAPI app
app = FastAPI(title="Gemini OCR API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.5-pro')

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page"""
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini OCR - Extract Text from Images</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 800px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            background: #f8f9ff;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-area:hover {
            background: #f0f2ff;
            border-color: #764ba2;
        }
        
        .upload-area.dragover {
            background: #e8ebff;
            border-color: #5a67d8;
        }
        
        #fileInput {
            display: none;
        }
        
        .upload-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .prompt-section {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            resize: vertical;
            font-family: inherit;
            transition: border-color 0.3s;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .result-section {
            margin-top: 30px;
            display: none;
        }
        
        .result-box {
            background: #f8f9ff;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 20px;
            min-height: 200px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            line-height: 1.6;
        }
        
        .preview-section {
            margin-top: 20px;
            display: none;
        }
        
        .preview-image {
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            background: #fee;
            border: 2px solid #fcc;
            color: #c33;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        
        .copy-btn {
            background: #4caf50;
            margin-top: 10px;
            padding: 10px 20px;
            width: auto;
        }
        
        .copy-btn:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Gemini OCR</h1>
        <p class="subtitle">Extract text from images using Google's Gemini AI</p>
        
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📁</div>
            <p><strong>Click to upload</strong> or drag and drop</p>
            <p style="color: #999; font-size: 0.9em;">PNG, JPG, JPEG, WEBP (Max 10MB)</p>
            <input type="file" id="fileInput" accept="image/*">
        </div>
        
        <div class="preview-section" id="previewSection">
            <label>Image Preview:</label>
            <img id="previewImage" class="preview-image" alt="Preview">
        </div>
        
        <div class="prompt-section">
            <label for="promptInput">Custom Prompt (Optional):</label>
            <textarea 
                id="promptInput" 
                rows="3" 
                placeholder="e.g., Extract all text from this image and format it as a list, or just leave blank for default extraction"
            ></textarea>
        </div>
        
        <button id="extractBtn" disabled>Extract Text</button>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p style="margin-top: 10px;">Processing image...</p>
        </div>
        
        <div class="error" id="error"></div>
        
        <div class="result-section" id="resultSection">
            <label>Extracted Text:</label>
            <div class="result-box" id="resultBox"></div>
            <button class="copy-btn" id="copyBtn">📋 Copy to Clipboard</button>
        </div>
    </div>
    
    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const extractBtn = document.getElementById('extractBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const resultSection = document.getElementById('resultSection');
        const resultBox = document.getElementById('resultBox');
        const promptInput = document.getElementById('promptInput');
        const previewSection = document.getElementById('previewSection');
        const previewImage = document.getElementById('previewImage');
        const copyBtn = document.getElementById('copyBtn');
        
        let selectedFile = null;
        
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
        
        function handleFile(file) {
            if (!file.type.startsWith('image/')) {
                showError('Please select an image file');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                showError('File size must be less than 10MB');
                return;
            }
            
            selectedFile = file;
            extractBtn.disabled = false;
            error.style.display = 'none';
            resultSection.style.display = 'none';
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewSection.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        
        extractBtn.addEventListener('click', async () => {
            if (!selectedFile) return;
            
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('prompt', promptInput.value.trim());
            
            extractBtn.disabled = true;
            loading.style.display = 'block';
            error.style.display = 'none';
            resultSection.style.display = 'none';
            
            try {
                const response = await fetch('/extract-text', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultBox.textContent = data.extracted_text;
                    resultSection.style.display = 'block';
                } else {
                    showError(data.detail || 'Failed to extract text');
                }
            } catch (err) {
                showError('Network error: ' + err.message);
            } finally {
                loading.style.display = 'none';
                extractBtn.disabled = false;
            }
        });
        
        copyBtn.addEventListener('click', () => {
            const text = resultBox.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            });
        });
        
        function showError(message) {
            error.textContent = message;
            error.style.display = 'block';
        }
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content)

@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    prompt: str = Form("")
):
    """
    Extract text from an uploaded image using Gemini API
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Prepare prompt
        if not prompt:
            prompt = "Extract all the text from this image. Return only the text content, preserving the layout and formatting as much as possible."
        
        # Generate content using Gemini
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
    return {"status": "healthy", "service": "Gemini OCR API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)