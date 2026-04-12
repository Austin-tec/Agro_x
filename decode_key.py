#!/usr/bin/env python3
import base64

key = 'sb_publishable_a2LepX7nz2RzmjqyJLalLQ__9kY8D3P'
print('Original key:', key)
print('Length:', len(key))

# Try base64 decode
try:
    decoded = base64.b64decode(key)
    print('Base64 decoded:', decoded)
    print('As string:', decoded.decode('utf-8', errors='ignore'))
except Exception as e:
    print('Not valid base64:', e)

# Check if it looks like JWT
parts = key.split('.')
print('JWT parts:', len(parts))
if len(parts) == 3:
    print('Header:', parts[0])
    print('Payload:', parts[1])
    print('Signature:', parts[2])
else:
    print('Not JWT format')