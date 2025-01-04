// js/fingerprint-reader.js

class FingerprintReader {
    constructor() {
        // Device configuration
        this.config = {
            vendorId: 0x05ba,  // DigitalPersona vendor ID
            productId: 0x000a, // U.are.U 4500 product ID
        };
        
        this.device = null;
        this.interface = null;
        this.endpointIn = null;
        this.endpointOut = null;
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

            // Open device
            await this.device.open();
            
            // Select configuration
            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // Get interface and endpoints
            const interfaces = this.device.configuration.interfaces;
            this.interface = interfaces[0];
            
            // Claim interface
            await this.device.claimInterface(this.interface.interfaceNumber);

            // Find the endpoints
            const alternate = this.interface.alternate;
            for (const endpoint of alternate.endpoints) {
                if (endpoint.direction === 'in') {
                    this.endpointIn = endpoint.endpointNumber;
                } else if (endpoint.direction === 'out') {
                    this.endpointOut = endpoint.endpointNumber;
                }
            }

            if (!this.endpointIn || !this.endpointOut) {
                throw new Error('Required endpoints not found');
            }

            // Initialize protocol handler
            this.protocol = new FingerprintProtocol(this.device, this.endpointIn, this.endpointOut);
            await this.protocol.initialize();

            return true;
        } catch (error) {
            // Clean up if initialization fails
            if (this.device) {
                try {
                    if (this.interface) {
                        await this.device.releaseInterface(this.interface.interfaceNumber);
                    }
                    await this.device.close();
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            }
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.device) {
            try {
                if (this.interface) {
                    await this.device.releaseInterface(this.interface.interfaceNumber);
                }
                await this.device.close();
                this.device = null;
                this.interface = null;
                this.endpointIn = null;
                this.endpointOut = null;
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
    constructor(device, endpointIn, endpointOut) {
        this.device = device;
        this.endpointIn = endpointIn;
        this.endpointOut = endpointOut;
        
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
            // Send reset command
            await this._sendCommand(this.commands.RESET);
            
            // Wait for device to reset
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Set parameters
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

    async _sendCommand(command, data = new Uint8Array([command])) {
        try {
            const result = await this.device.transferOut(this.endpointOut, data);
            if (result.status !== 'ok') {
                throw new Error(`Command transfer failed: ${result.status}`);
            }
            return true;
        } catch (error) {
            throw new Error(`Command failed: ${error.message}`);
        }
    }

    async _getStatus() {
        try {
            const result = await this.device.transferIn(this.endpointIn, 64);
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
            const result = await this.device.transferIn(this.endpointIn, 150000);
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
            this.commands.SET_PARAMS,
            0x01, // Parameter 1
            0x02, // Parameter 2
            0x03  // Parameter 3
        ]);
        
        await this._sendCommand(this.commands.SET_PARAMS, params);
    }
}

export default FingerprintReader;