// js/main.js

import FingerprintReader from './fingerprint-reader.js';

class UIController {
    constructor() {
        this.reader = new FingerprintReader();
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Buttons
        this.connectBtn = document.getElementById('connectBtn');
        this.scanBtn = document.getElementById('scanBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');

        // Status elements
        this.statusDot = document.querySelector('.dot');
        this.statusText = document.getElementById('statusText');
        
        // Preview area
        this.previewArea = document.getElementById('previewArea');
        this.placeholder = document.getElementById('placeholder');
        
        // Log container
        this.logContainer = document.getElementById('logContainer');
    }

    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.scanBtn.addEventListener('click', () => this.scan());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logContainer.appendChild(entry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    updateStatus(connected) {
        this.statusDot.classList.toggle('connected', connected);
        this.statusText.textContent = connected ? 'Connected' : 'Not Connected';
        this.scanBtn.disabled = !connected;
        this.disconnectBtn.disabled = !connected;
        this.connectBtn.disabled = connected;
    }

    async connect() {
        try {
            this.log('Connecting to device...');
            await this.reader.connect();
            this.updateStatus(true);
            this.log('Device connected successfully', 'success');
        } catch (error) {
            this.log(`Connection error: ${error.message}`, 'error');
            this.updateStatus(false);
        }
    }

    async disconnect() {
        try {
            this.log('Disconnecting device...');
            await this.reader.disconnect();
            this.updateStatus(false);
            this.log('Device disconnected', 'success');
            
            // Clear preview
            while (this.previewArea.firstChild) {
                this.previewArea.firstChild.remove();
            }
            this.previewArea.appendChild(this.placeholder);
        } catch (error) {
            this.log(`Disconnection error: ${error.message}`, 'error');
        }
    }

    async scan() {
        try {
            this.log('Starting fingerprint scan...');
            this.scanBtn.disabled = true;
            
            const fingerprintBlob = await this.reader.capture();
            const imageUrl = URL.createObjectURL(fingerprintBlob);
            
            // Display the fingerprint
            const img = document.createElement('img');
            img.src = imageUrl;
            img.onload = () => URL.revokeObjectURL(imageUrl);
            
            // Clear preview area and add new image
            while (this.previewArea.firstChild) {
                this.previewArea.firstChild.remove();
            }
            this.previewArea.appendChild(img);
            
            this.log('Fingerprint captured successfully', 'success');
        } catch (error) {
            this.log(`Scan error: ${error.message}`, 'error');
        } finally {
            this.scanBtn.disabled = false;
            
            if (this.reader.isConnected()) {
                this.scanBtn.disabled = false;
            }
        }
    }
}

// Initialize the UI controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
});