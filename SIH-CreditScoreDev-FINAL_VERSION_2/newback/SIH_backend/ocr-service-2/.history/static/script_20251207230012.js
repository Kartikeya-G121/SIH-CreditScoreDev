const imageInput = document.getElementById('imageInput');
const uploadBtn = document.getElementById('uploadBtn');
const extractBtn = document.getElementById('extractBtn');
const imagePreview = document.getElementById('imagePreview');
const fileName = document.getElementById('fileName');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const extractedText = document.getElementById('extractedText');
const copyBtn = document.getElementById('copyBtn');

let selectedFile = null;

uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        fileName.textContent = `Selected: ${file.name}`;
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
        
        extractBtn.disabled = false;
        resultSection.style.display = 'none';
    }
});

extractBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    // Show loading
    loading.style.display = 'block';
    resultSection.style.display = 'none';
    extractBtn.disabled = true;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        const response = await fetch('/extract-text/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to extract text');
        }
        
        const data = await response.json();
        
        // Display results
        extractedText.value = data.extracted_text;
        resultSection.style.display = 'block';
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        loading.style.display = 'none';
        extractBtn.disabled = false;
    }
});

copyBtn.addEventListener('click', () => {
    extractedText.select();
    document.execCommand('copy');
    
    // Visual feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
});