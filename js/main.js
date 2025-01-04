import FingerprintReader from './fingerprint-reader.js';

const connectBtn = document.getElementById('connectBtn');
const scanBtn = document.getElementById('scanBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const previewImage = document.getElementById('previewImage');
const logContainer = document.getElementById('logContainer');

const reader = new FingerprintReader();

const logMessage = (message, type = 'info') => {
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    entry.className = `log-entry ${type}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
};

connectBtn.addEventListener('click', async () => {
    try {
        await reader.connect();
        logMessage('Device connected successfully.', 'success');
        scanBtn.disabled = false;
        disconnectBtn.disabled = false;
        connectBtn.disabled = true;
    } catch (error) {
        logMessage(error.message, 'error');
    }
});

scanBtn.addEventListener('click', async () => {
    try {
        logMessage('Capturing fingerprint...');
        const fingerprintBlob = await reader.capture();
        previewImage.src = URL.createObjectURL(fingerprintBlob);
        logMessage('Fingerprint captured successfully.', 'success');
    } catch (error) {
        logMessage(error.message, 'error');
    }
});

disconnectBtn.addEventListener('click', async () => {
    try {
        await reader.disconnect();
        logMessage('Device disconnected successfully.', 'success');
        scanBtn.disabled = true;
        disconnectBtn.disabled = true;
        connectBtn.disabled = false;
        previewImage.src = 'https://via.placeholder.com/150';
    } catch (error) {
        logMessage(error.message, 'error');
    }
});
