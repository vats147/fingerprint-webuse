class FingerprintReader {
    constructor() {
        this.config = {
            vendorId: 0x05ba,  // DigitalPersona vendor ID
            productId: 0x000a, // DigitalPersona product ID
        };

        this.device = null;
        this.endpointIn = null;
        this.endpointOut = null;
    }

    async connect() {
        if (!navigator.usb) {
            throw new Error('WebUSB is not supported in this browser.');
        }

        try {
            this.device = await navigator.usb.requestDevice({
                filters: [{ vendorId: this.config.vendorId, productId: this.config.productId }]
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
        } catch (error) {
            throw new Error(`Failed to connect: ${error.message}`);
        }
    }

    async disconnect() {
        if (!this.device) {
            throw new Error('No device connected.');
        }

        try {
            await this.device.releaseInterface(0);
            await this.device.close();
            this.device = null;
            console.log('Device disconnected successfully.');
        } catch (error) {
            throw new Error(`Failed to disconnect: ${error.message}`);
        }
    }

    async capture() {
        if (!this.device) {
            throw new Error('Device not connected.');
        }

        try {
            const command = new Uint8Array([0x04]); // Replace with actual capture command
            await this.device.transferOut(this.endpointOut, command);

            const response = await this.device.transferIn(this.endpointIn, 512); // Adjust buffer size
            return new Blob([response.data.buffer], { type: 'image/png' });
        } catch (error) {
            throw new Error(`Failed to capture fingerprint: ${error.message}`);
        }
    }
}

export default FingerprintReader;
