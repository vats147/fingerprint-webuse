class FingerprintReader {
    constructor() {
        this.config = {
            vendorId: 0x05ba,  // DigitalPersona vendor ID
            productId: 0x000a, // DigitalPersona product ID
            timeout: 10000,    // 10 second timeout for operations
            imageWidth: 380,
            imageHeight: 356,
            commandDelay: 100  // Delay between commands in ms
        };

        this.device = null;
        this.endpointIn = null;
        this.endpointOut = null;
        this.isCapturing = false;
    }

    async connect() {
        if (!navigator.usb) {
            throw new Error('WebUSB is not supported in this browser.');
        }

        try {
            this.device = await navigator.usb.requestDevice({
                filters: [{ 
                    vendorId: this.config.vendorId, 
                    productId: this.config.productId 
                }]
            });

            await this.device.open();

            if (!this.device.configuration) {
                await this.device.selectConfiguration(1);
            }

            await this.device.claimInterface(0);

            const interfaceDescriptor = this.device.configuration.interfaces[0];
            for (const endpoint of interfaceDescriptor.alternates[0].endpoints) {
                if (endpoint.direction === 'in') this.endpointIn = endpoint.endpointNumber;
                if (endpoint.direction === 'out') this.endpointOut = endpoint.endpointNumber;
            }

            if (!this.endpointIn || !this.endpointOut) {
                throw new Error('Required endpoints not found on the device.');
            }

            console.log('Device connected successfully.');
            return true;
        } catch (error) {
            this.device = null;
            this.endpointIn = null;
            this.endpointOut = null;
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    async disconnect() {
        if (!this.device) {
            throw new Error('No device connected.');
        }

        try {
            if (this.isCapturing) {
                await this.cancelCapture();
            }
            await this.device.releaseInterface(0);
            await this.device.close();
            this.device = null;
            this.endpointIn = null;
            this.endpointOut = null;
            console.log('Device disconnected successfully.');
            return true;
        } catch (error) {
            throw new Error(`Disconnection failed: ${error.message}`);
        }
    }

    async sendCommand(command, expectedResponse = null) {
        if (!this.device) {
            throw new Error('Device not connected.');
        }

        try {
            await this.device.transferOut(this.endpointOut, new Uint8Array([command]));
            
            if (expectedResponse !== null) {
                const response = await this.device.transferIn(this.endpointIn, 64);
                const responseData = new Uint8Array(response.data.buffer);
                
                if (expectedResponse !== responseData[0]) {
                    throw new Error(`Invalid response: expected ${expectedResponse}, got ${responseData[0]}`);
                }
                
                return responseData;
            }
            
            await new Promise(resolve => setTimeout(resolve, this.config.commandDelay));
            return true;
        } catch (error) {
            throw new Error(`Command 0x${command.toString(16)} failed: ${error.message}`);
        }
    }

    async waitForFingerprint(timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const response = await this.sendCommand(0x09); // Check finger presence
                const status = new Uint8Array(response)[0];
                
                if (status === 0x01) {
                    return true; // Finger detected
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                throw new Error(`Finger detection failed: ${error.message}`);
            }
        }
        
        throw new Error('Timeout waiting for fingerprint');
    }

    async cancelCapture() {
        if (this.isCapturing) {
            try {
                await this.sendCommand(0x08); // Cancel command
                this.isCapturing = false;
                return true;
            } catch (error) {
                throw new Error(`Failed to cancel capture: ${error.message}`);
            }
        }
        return false;
    }

    async capture(options = {}) {
        if (this.isCapturing) {
            throw new Error('Capture already in progress');
        }

        const {
            timeout = this.config.timeout,
            waitForFinger = true,
            enhanceImage = true,
            format = 'png'
        } = options;

        this.isCapturing = true;
        const captureStart = Date.now();

        try {
            // Step 1: Initialize device
            await this.sendCommand(0x02, 0x00);
            console.log('Device initialized');

            // Step 2: Turn on LED
            await this.sendCommand(0x03, 0x00);
            console.log('LED activated');

            // Step 3: Wait for finger if requested
            if (waitForFinger) {
                console.log('Waiting for finger...');
                await this.waitForFingerprint(timeout);
            }

            // Step 4: Start capture
            await this.sendCommand(0x04, 0x00);
            console.log('Capture started');

            // Step 5: Wait for capture completion
            let captureComplete = false;
            while (!captureComplete && Date.now() - captureStart < timeout) {
                const status = await this.sendCommand(0x07, null); // Get status
                if (status[0] === 0x00) {
                    captureComplete = true;
                } else if (status[0] === 0xFF) {
                    throw new Error('Capture failed');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (!captureComplete) {
                throw new Error('Capture timeout');
            }

            // Step 6: Request image data
            await this.sendCommand(0x05, 0x00);
            
            // Step 7: Read image data
            const imageSize = this.config.imageWidth * this.config.imageHeight;
            const imageData = new Uint8Array(imageSize);
            let bytesRead = 0;

            while (bytesRead < imageSize) {
                const chunk = await this.device.transferIn(this.endpointIn, 
                    Math.min(1024, imageSize - bytesRead));
                imageData.set(new Uint8Array(chunk.data.buffer), bytesRead);
                bytesRead += chunk.data.byteLength;
            }

            // Step 8: Process image
            const processedImage = enhanceImage ? 
                await this.enhanceImage(imageData) : 
                imageData;

            // Step 9: Convert to requested format
            const blob = await this.convertToFormat(processedImage, format);

            this.isCapturing = false;
            return blob;

        } catch (error) {
            this.isCapturing = false;
            throw error;
        } finally {
            try {
                // Turn off LED
                await this.sendCommand(0x03, 0x00);
            } catch (error) {
                console.error('Failed to turn off LED:', error);
            }
        }
    }

    async enhanceImage(imageData) {
        // Basic image enhancement
        const enhanced = new Uint8Array(imageData.length);
        
        // Apply basic contrast enhancement
        const min = Math.min(...imageData);
        const max = Math.max(...imageData);
        const range = max - min;
        
        for (let i = 0; i < imageData.length; i++) {
            enhanced[i] = Math.floor(((imageData[i] - min) / range) * 255);
        }
        
        return enhanced;
    }

    async convertToFormat(imageData, format) {
        // Create a canvas to convert the raw data to an image
        const canvas = document.createElement('canvas');
        canvas.width = this.config.imageWidth;
        canvas.height = this.config.imageHeight;
        const ctx = canvas.getContext('2d');
        
        // Create ImageData from the raw bytes
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < imageData.length; i++) {
            const value = imageData[i];
            imgData.data[i * 4] = value;     // R
            imgData.data[i * 4 + 1] = value; // G
            imgData.data[i * 4 + 2] = value; // B
            imgData.data[i * 4 + 3] = 255;   // A
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, `image/${format}`);
        });
    }
}

export default FingerprintReader;