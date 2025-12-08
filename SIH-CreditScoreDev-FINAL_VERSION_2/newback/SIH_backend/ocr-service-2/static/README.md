"""
# Gemini OCR Application

Extract text from images using Google's Gemini API with FastAPI.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up API Key**
   - Get your Gemini API key from: https://makersuite.google.com/app/apikey
   - Create a `.env` file in the project root
   - Add your API key:
     ```
     GOOGLE_API_KEY=your_actual_api_key_here
     ```

3. **Run the Application**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload
   ```

4. **Access the Application**
   - Open browser: http://localhost:8000
   - API docs: http://localhost:8000/docs

## API Endpoints

- `GET /` - Web interface
- `POST /extract-text` - Extract text from image
  - Parameters:
    - `file`: Image file (required)
    - `prompt`: Custom extraction prompt (optional)
- `GET /health` - Health check

## Features

- ✅ Upload images via click or drag-and-drop
- ✅ Custom prompts for specific extraction needs
- ✅ Image preview before processing
- ✅ Copy extracted text to clipboard
- ✅ Support for PNG, JPG, JPEG, WEBP
- ✅ Beautiful responsive UI
- ✅ Real-time processing with loading indicators

## Usage Example

```python
import requests

url = "http://localhost:8000/extract-text"
files = {"file": open("image.jpg", "rb")}
data = {"prompt": "Extract all text"}

response = requests.post(url, files=files, data=data)
print(response.json()["extracted_text"])
```

## Notes

- Maximum file size: 10MB
- Supported formats: PNG, JPG, JPEG, WEBP
- Requires valid Google Gemini API key
"""