#!/bin/bash
# Script to install SSH key on server
# This will be run on the server

mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "SSH_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

