#!/usr/bin/env python3
import pexpect
import sys
import time

host = "159.65.76.180"
user = "root"
password = "Ongoza@#1CyberHub"
commands = [
    "cd ~/ongozacyberhub && git pull origin main",
    "cd ~/ongozacyberhub/frontend/nextjs_app && npm install",
    "cd ~/ongozacyberhub/backend/django_app && pip3 install -r requirements.txt --break-system-packages",
    "cd ~/ongozacyberhub/frontend/nextjs_app && npm run build",
    "cd ~/ongozacyberhub && pm2 restart ongoza-nextjs && pm2 restart ongoza-django",
    "pm2 status"
]

try:
    print(f"Connecting to {user}@{host}...")
    child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null {user}@{host}', timeout=120)
    child.logfile = sys.stdout.buffer
    
    patterns = ['password:', 'Password:', 'yes/no', '# ', '$ ', pexpect.EOF, pexpect.TIMEOUT]
    index = child.expect(patterns, timeout=30)
    
    if index == 2:  # yes/no
        print("Accepting host key...")
        child.sendline('yes')
        index = child.expect(['password:', 'Password:', '# ', '$ '], timeout=10)
    
    if index in [0, 1]:  # password prompt
        print("Sending password...")
        time.sleep(0.5)
        child.sendline(password)
        time.sleep(1)
        
        # Wait for prompt
        index = child.expect(['# ', '$ ', 'password:', 'Permission denied', pexpect.TIMEOUT], timeout=15)
        
        if 'Permission denied' in str(child.before) or index == 3:
            print("Password authentication failed. Trying again...")
            child.sendline(password)
            index = child.expect(['# ', '$ ', pexpect.TIMEOUT], timeout=15)
    
    if index not in [0, 1]:
        print(f"Failed to authenticate. Index: {index}")
        print(f"Buffer: {child.before.decode()}")
        sys.exit(1)
    
    print("Connected successfully!")
    
    for cmd in commands:
        print(f"\n>>> Executing: {cmd}")
        child.sendline(cmd)
        child.expect(['# ', '$ ', pexpect.TIMEOUT], timeout=600)
        output = child.before.decode()
        if output:
            print(output)
    
    print("\n>>> Deployment complete!")
    child.sendline('exit')
    child.expect(pexpect.EOF)
    child.close()
    
except pexpect.TIMEOUT:
    print("Timeout occurred")
    print(f"Buffer: {child.before.decode()}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

