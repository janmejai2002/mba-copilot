
import wave
import struct
import math

def create_sine_wav(filename, duration=5, freq=440):
    sample_rate = 16000
    n_frames = sample_rate * duration
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1)
        obj.setsampwidth(2)
        obj.setframerate(sample_rate)
        for i in range(n_frames):
            value = int(32767.0 * math.sin(freq * 2.0 * math.pi * i / sample_rate))
            data = struct.pack('<h', value)
            obj.writeframesraw(data)
    print(f"✅ Created {filename}")

if __name__ == "__main__":
    create_sine_wav("test_audio.wav")
