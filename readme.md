# WebUSB Fingerprint Reader Library

A JavaScript library for interfacing with DigitalPersona 4500 fingerprint readers using WebUSB. This library enables web applications to capture fingerprints directly through the browser without requiring any additional drivers or software installations.

## Features

- 🔌 Direct USB communication via WebUSB API
- 📷 Fingerprint image capture and processing
- 🖼️ Standard web image format output (Blob/ArrayBuffer)
- 🚀 Modern browser support
- 📱 Responsive UI
- 🛠️ Error handling and status reporting
- 📝 Real-time activity logging

## Prerequisites

- Modern browser with WebUSB support (Chrome, Edge, Opera)
- DigitalPersona 4500 fingerprint reader
- Secure context (HTTPS or localhost)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/webusb-fingerprint-reader.git
cd webusb-fingerprint-reader
```

2. Set up the project structure:
```
fingerprint-scanner/
├── index.html
├── styles.css
├── README.md
└── js/
    ├── main.js
    └── fingerprint-reader.js
```

3. Serve the files using a local web server. For development, you can use Python's built-in server:
```bash
python -m http.server 8000
```

## Usage

### Basic Implementation

```javascript
import FingerprintReader from './js/fingerprint-reader.js';

const reader = new FingerprintReader();

// Connect to device
await reader.connect();

// Capture fingerprint
const fingerprintBlob = await reader.capture();

// Disconnect
await reader.disconnect();
```

### HTML Integration

```html
<button id="connectBtn">Connect Device</button>
<button id="scanBtn">Scan Fingerprint</button>
<button id="disconnectBtn">Disconnect</button>
<div id="previewArea"></div>
```

### UI Controller Usage

```javascript
const ui = new UIController();
// UI will handle all button events and display updates automatically
```

## API Reference

### FingerprintReader Class

#### Methods

- `connect()`: Initialize connection with the fingerprint reader
- `disconnect()`: Safely disconnect from the device
- `capture()`: Capture a fingerprint image
- `isConnected()`: Check if device is currently connected

#### Events

- Device connection status changes
- Capture progress updates
- Error notifications

### UIController Class

#### Methods

- `updateStatus(connected)`: Update UI connection status
- `log(message, type)`: Add entry to activity log
- `scan()`: Initiate fingerprint scan
- `connect()`: Connect to device
- `disconnect()`: Disconnect from device

## Error Handling

The library includes comprehensive error handling for common scenarios:

- Device connection failures
- Communication timeouts
- Capture errors
- Device disconnection
- Protocol errors
- Invalid data formats

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅     |
| Edge    | ✅     |
| Opera   | ✅     |
| Firefox | ❌     |
| Safari  | ❌     |

## Security Considerations

1. WebUSB requires a secure context (HTTPS or localhost)
2. User must explicitly grant permission to access the USB device
3. Device access is limited to the current browser session
4. No persistent device access without user interaction

## Troubleshooting

Common issues and solutions:

1. Device Not Found
   - Ensure the device is properly connected
   - Check USB permissions in browser settings
   - Verify vendor and product IDs match your device

2. Connection Errors
   - Refresh the page and reconnect
   - Check USB cable connection
   - Ensure no other applications are using the device

3. Capture Failures
   - Clean the sensor surface
   - Ensure proper finger placement
   - Check for timeout settings

## Development

### Building from Source

No build step required - the library uses native ES modules.

### Testing

1. Start local server:
```bash
python -m http.server 8000
```

2. Open browser:
```
http://localhost:8000
```

3. Connect device and run tests

### Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Based on libfprint's protocol documentation
- Inspired by WebUSB API examples
- Thanks to the DigitalPersona documentation

## Support

For support, please:

1. Check existing issues
2. Create a new issue with:
   - Browser version
   - Device model
   - Error messages
   - Steps to reproduce

## Project Status

Active development - Contributions welcome!

## Future Enhancements

- [ ] Image quality assessment
- [ ] Multiple device support
- [ ] Enhanced error recovery
- [ ] Additional device protocols
- [ ] WebWorker support
- [ ] Progressive Web App integration

## Version History

- 1.0.0: Initial release
- 1.0.1: Bug fixes and improvements
- 1.1.0: Added enhanced error handling