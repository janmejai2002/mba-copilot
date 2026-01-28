import sys

# Read the corrupted file
with open('components/SessionView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 396-417 (the duplicate code block)
# Keep everything before line 396 and after line 417
fixed_lines = lines[:395] + ['              onClick={isRecording ? stopRecording : startRecording}\n'] + lines[418:]

# Write the fixed version
with open('components/SessionView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("✅ Fixed! Removed lines 396-417 and added onClick handler")
