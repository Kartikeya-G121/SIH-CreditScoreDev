import pytesseract
from PIL import Image
import cv2
import numpy as np
from pdf2image import convert_from_path
import io
import logging
import shutil
import os
from typing import Optional, List
from config import Config

logger = logging.getLogger(__name__)


class OCRProcessor:
    """Process images/PDFs and extract text using Tesseract and EasyOCR"""
    
    def __init__(self):
        # Set Tesseract command path
        if Config.TESSERACT_CMD != 'tesseract':
            pytesseract.pytesseract.tesseract_cmd = Config.TESSERACT_CMD
        


    def check_dependencies(self, file_type: str = None):
        """Check if necessary dependencies are installed"""
        
        # Check Tesseract
        if not shutil.which(Config.TESSERACT_CMD) and not os.path.exists(Config.TESSERACT_CMD):
            raise RuntimeError(
                f"Tesseract not found at {Config.TESSERACT_CMD}. "
                "Please install Tesseract OCR and add it to PATH or update .env"
            )
            
        # Check Poppler for PDF
        if file_type == '.pdf':
            if not shutil.which('pdftoppm') and not shutil.which('pdfinfo'):
                raise RuntimeError(
                    "Poppler not found. Please install Poppler for PDF processing. "
                    "(apt-get install poppler-utils or download for Windows)"
                )
    

    
    def extract_text_from_image(self, image_path: str, use_easyocr: bool = False) -> str:
        """Extract text from image file"""
        logger.info(f"Extracting text from image: {image_path}")
        
        self.check_dependencies()
        
        try:
            # Load and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            preprocessed = self._preprocess_image(image)
            return self._extract_with_tesseract(preprocessed)
        
        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            raise
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        logger.info(f"Extracting text from PDF: {pdf_path}")
        
        self.check_dependencies('.pdf')
        
        try:
            # Convert PDF to images
            images = convert_from_path(pdf_path, dpi=300)
            
            all_text = []
            for i, image in enumerate(images):
                logger.info(f"Processing page {i+1}/{len(images)}")
                
                # Convert PIL image to numpy array
                image_np = np.array(image)
                preprocessed = self._preprocess_image(image_np)
                
                # Extract text
                text = self._extract_with_tesseract(preprocessed)
                all_text.append(text)
            
            return '\n\n'.join(all_text)
        
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def extract_text_from_bytes(self, image_bytes: bytes, use_easyocr: bool = False) -> str:
        """Extract text from image bytes"""
        logger.info("Extracting text from image bytes")
        
        self.check_dependencies()
        
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            
            preprocessed = self._preprocess_image(image_np)
            return self._extract_with_tesseract(preprocessed)
        
        except Exception as e:
            logger.error(f"Error extracting text from bytes: {e}")
            raise
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR accuracy"""
        
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            denoised, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Deskew (optional - can improve accuracy)
        # thresh = self._deskew(thresh)
        
        return thresh
    
    def _extract_with_tesseract(self, image: np.ndarray) -> str:
        """Extract text using Tesseract OCR"""
        logger.info("Using Tesseract OCR")
        
        # Configure Tesseract
        custom_config = r'--oem 3 --psm 6'  # LSTM OCR Engine, Assume uniform block of text
        
        text = pytesseract.image_to_string(
            image, 
            lang=Config.OCR_LANGUAGE,
            config=custom_config
        )
        
        return text.strip()
    

    
    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """Deskew image to improve OCR accuracy"""
        coords = np.column_stack(np.where(image > 0))
        angle = cv2.minAreaRect(coords)[-1]
        
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        return rotated
