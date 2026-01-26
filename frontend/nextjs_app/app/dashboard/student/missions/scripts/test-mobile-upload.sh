#!/bin/bash
# Mobile camera upload test script
# Tests mobile upload functionality on iOS/Android devices

echo "=== Mobile Camera Upload Test ==="
echo ""
echo "This script tests mobile camera upload functionality."
echo "Run this on an actual iOS or Android device, or use an emulator."
echo ""

# Check if running on mobile device
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - use iOS Simulator or Android Emulator"
    echo ""
    echo "For iOS Simulator:"
    echo "  xcrun simctl boot <device-id>"
    echo "  open -a Simulator"
    echo ""
    echo "For Android Emulator:"
    echo "  emulator -avd <avd-name>"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux - use Android Emulator"
    echo "  emulator -avd <avd-name>"
fi

echo ""
echo "Test Checklist:"
echo "  [ ] Open missions page on mobile device"
echo "  [ ] Click on a mission"
echo "  [ ] Tap 'Camera' button"
echo "  [ ] Grant camera permission"
echo "  [ ] Take a photo"
echo "  [ ] Verify photo is uploaded"
echo "  [ ] Tap 'Gallery' button"
echo "  [ ] Select an image from gallery"
echo "  [ ] Verify image is uploaded"
echo "  [ ] Check upload progress indicator"
echo "  [ ] Verify file appears in submission"
echo ""

# Browser-based test
echo "Running browser-based mobile detection test..."
node << 'EOF'
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
console.log(`Mobile device detected: ${isMobile ? 'YES' : 'NO'}`);
console.log(`User Agent: ${navigator.userAgent || 'N/A'}`);

// Test MediaDevices API availability
if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
  console.log('MediaDevices API: Available');
  console.log('getUserMedia available:', typeof navigator.mediaDevices.getUserMedia === 'function');
} else {
  console.log('MediaDevices API: Not available');
}
EOF

echo ""
echo "=== Test Complete ==="

