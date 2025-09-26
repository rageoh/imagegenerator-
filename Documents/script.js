// FLUX.1 Image Generator - JavaScript
class FluxImageGenerator {
    constructor() {
        this.apiKey = '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'; // Replace with your actual API key
        this.apiUrl = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Generate button click
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateImage();
        });

        // Guidance scale slider
        const guidanceSlider = document.getElementById('guidance');
        const guidanceValue = document.getElementById('guidanceValue');
        
        guidanceSlider.addEventListener('input', (e) => {
            guidanceValue.textContent = e.target.value;
        });

        // Enter key in prompt textarea
        document.getElementById('prompt').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateImage();
            }
        });

        // API key is now hardcoded, no need for input listener
    }

    async generateImage() {
        const prompt = document.getElementById('prompt').value.trim();
        const numImages = parseInt(document.getElementById('numImages').value);
        const guidance = parseFloat(document.getElementById('guidance').value);

        // API key is now hardcoded, no validation needed

        if (!prompt) {
            this.showError('Please enter a prompt for image generation');
            return;
        }

        // Show loading state
        this.showLoading();
        this.hideError();
        this.clearResults();

        try {
            const response = await this.callFluxAPI(prompt, numImages, guidance);
            
            if (response.error) {
                throw new Error(response.error);
            }

            this.displayResults(response, prompt);
        } catch (error) {
            console.error('Error generating image:', error);
            this.showError(`Failed to generate image: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async callFluxAPI(prompt, numImages, guidance) {
        const requestBody = {
            inputs: prompt,
            parameters: {
                num_inference_steps: 20,
                guidance_scale: guidance,
                num_images_per_prompt: numImages
            }
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if response is JSON (error) or binary (image)
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            // For image responses, we need to handle them differently
            // FLUX.1 typically returns base64 encoded images
            const blob = await response.blob();
            return { images: [URL.createObjectURL(blob)] };
        }
    }

    displayResults(response, prompt) {
        const resultsContainer = document.getElementById('imageResults');
        
        // Handle different response formats
        let images = [];
        
        if (response.images) {
            images = response.images;
        } else if (Array.isArray(response)) {
            images = response;
        } else if (response.generated_images) {
            images = response.generated_images;
        }

        if (images.length === 0) {
            this.showError('No images were generated. Please try a different prompt.');
            return;
        }

        images.forEach((imageData, index) => {
            const imageCard = this.createImageCard(imageData, prompt, index);
            resultsContainer.appendChild(imageCard);
        });
    }

    createImageCard(imageData, prompt, index) {
        const card = document.createElement('div');
        card.className = 'image-card';

        const img = document.createElement('img');
        
        // Handle different image data formats
        if (typeof imageData === 'string') {
            if (imageData.startsWith('data:image/')) {
                img.src = imageData;
            } else if (imageData.startsWith('blob:')) {
                img.src = imageData;
            } else {
                // Assume it's a base64 string
                img.src = `data:image/png;base64,${imageData}`;
            }
        } else if (imageData.url) {
            img.src = imageData.url;
        } else {
            console.error('Unknown image data format:', imageData);
            return card;
        }

        img.alt = `Generated image: ${prompt}`;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'image-info';
        
        const promptText = document.createElement('p');
        promptText.textContent = `Prompt: ${prompt}`;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => {
            this.downloadImage(img.src, `flux-image-${index + 1}.png`);
        });

        info.appendChild(promptText);
        info.appendChild(downloadBtn);
        
        card.appendChild(img);
        card.appendChild(info);

        return card;
    }

    downloadImage(imageSrc, filename) {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showLoading() {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('generateBtn').disabled = true;
        document.querySelector('.btn-text').style.display = 'none';
        document.querySelector('.loading-spinner').style.display = 'inline';
    }

    hideLoading() {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('generateBtn').disabled = false;
        document.querySelector('.btn-text').style.display = 'inline';
        document.querySelector('.loading-spinner').style.display = 'none';
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    clearResults() {
        document.getElementById('imageResults').innerHTML = '';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FluxImageGenerator();
    
    // Add some helpful tips
    console.log('🎨 FLUX.1 Image Generator loaded!');
    console.log('💡 Tips:');
    console.log('   - Use Ctrl+Enter in the prompt field to generate');
    console.log('   - Get your API key from: https://huggingface.co/settings/tokens');
    console.log('   - Try detailed prompts for better results');
});
