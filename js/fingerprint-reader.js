// js/fingerprint-reader.js

class FingerprintReader {
    constructor() {
        // Device configuration
        this.config = {
            vendorId: 0x05ba,  // DigitalPersona vendor ID
            productId: 0x000a, // U.are.U 4500 product ID
            interfaceNumber: 0,
            endpoints: {
                in: 1,
                out: 2
            }
        };
        
        this.device = null;
        this.protocol = null;
    }

    async connect() {
        try {
            // Request device
            this.device = await navigator.usb.requestDevice({
                filters: [{
                    vendorId: this.config.vendorId,
                    productId: this.config.productId
                }]
            });

            // Open device and select configuration
            await this.device.open();
            await this.device.selectConfiguration(1);
            await this.device.claimInterface(this.config.interfaceNumber);

            // Initialize protocol handler
            this.protocol = new FingerprintProtocol(this.device);
            await this.protocol.initialize();

            return true;
        } catch (error) {
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.device) {
            try {
                await this.device.close();
                this.device = null;
                this.protocol = null;
                return true;
            } catch (error) {
                throw new Error(`Disconnection failed: ${error.message}`);
            }
        }
    }

    async capture() {
        if (!this.device || !this.protocol) {
            throw new Error('Device not connected');
        }

        try {
            return await this.protocol.captureImage();
        } catch (error) {
            throw new Error(`Capture failed: ${error.message}`);
        }
    }

    isConnected() {
        return this.device !== null && this.protocol !== null;
    }
}

class FingerprintProtocol {
    constructor(device) {
        this.device = device;
        this.commands = {
            RESET: 0x01,
            GET_STATUS: 0x02,
            SET_PARAMS: 0x03,
            CAPTURE: 0x04,
            GET_IMAGE: 0x05
        };
    }

    async initialize() {
        try {
            await this._sendCommand(this.commands.RESET);
            await this._setParameters();
            return true;
        } catch (error) {
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    async captureImage() {
        try {
            // Start capture
            await this._sendCommand(this.commands.CAPTURE);
            
            // Wait for finger detection
            await this._waitForFinger();
            
            // Get image data
            const imageData = await this._getImage();
            
            // Process and return image
            return this._processImage(imageData);
        } catch (error) {
            throw new Error(`Image capture failed: ${error.message}`);
        }
    }

    async _sendCommand(command, data = new Uint8Array(0)) {
        try {
            await this.device.transferOut(1, data);
            return true;
        } catch (error) {
            throw new Error(`Command failed: ${error.message}`);
        }
    }

    async _getStatus() {
        try {
            const result = await this.device.transferIn(1, 64);
            return new Uint8Array(result.data.buffer);
        } catch (error) {
            throw new Error(`Status read failed: ${error.message}`);
        }
    }

    async _waitForFinger(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const status = await this._getStatus();
            if (status[0] & 0x01) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Timeout waiting for finger');
    }

    async _getImage() {
        try {
            const result = await this.device.transferIn(1, 150000); // Adjust size based on your device
            return new Uint8Array(result.data.buffer);
        } catch (error) {
            throw new Error(`Image read failed: ${error.message}`);
        }
    }

    _processImage(rawData) {
        // Create a blob from the raw data
        return new Blob([rawData], { type: 'image/bmp' });
    }

    async _setParameters() {
        // Set device parameters (adjust based on your device)
        const params = new Uint8Array([
            0x01, // Parameter 1
            0x02, // Parameter 2
            0x03  // Parameter 3
        ]);
        
        await this._sendCommand(this.commands.SET_PARAMS, params);
    }
}

export default FingerprintReader;