#!/bin/bash

# Script to test the attachments frontend
# Opens the test HTML page in the default browser

echo "🚀 Starting Deals Pipeline Attachment Test"
echo ""
echo "This will:"
echo "1. Start the backend server"
echo "2. Open the test page in your browser"
echo ""

# Check if server is already running
if lsof -Pi :3004 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server already running on port 3004"
else
    echo "⏳ Starting server..."
    npm run dev &
    SERVER_PID=$!
    echo "✅ Server started (PID: $SERVER_PID)"
    sleep 3
fi

# Open test page
TEST_FILE="file://$(pwd)/frontend/test-attachments.html"
echo ""
echo "📂 Opening test page..."
echo "URL: $TEST_FILE"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$TEST_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$TEST_FILE"
else
    echo "Please open this URL in your browser:"
    echo "$TEST_FILE"
fi

echo ""
echo "✨ Test page opened!"
echo ""
echo "Instructions:"
echo "1. The page will auto-login with dev credentials"
echo "2. Select a lead from the dropdown"
echo "3. Upload a test document"
echo "4. View and download attachments"
echo "5. Add and view notes"
echo ""
echo "Press Ctrl+C to stop the server when done"
echo ""

# Wait for user to stop
if [ ! -z "$SERVER_PID" ]; then
    wait $SERVER_PID
fi
