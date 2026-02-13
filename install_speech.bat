@echo off
echo Installing google-cloud-speech...
pip install google-cloud-speech>=2.26.0 --no-cache-dir
echo.
echo Installation complete! Now uncomment the audio features in backend/main.py
echo Lines to uncomment:
echo   - Line 12-13: audio_streamer and scribe_agent imports
echo   - Lines 82-135: WebSocket audio endpoint
pause
