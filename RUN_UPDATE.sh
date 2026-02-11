#!/bin/bash
# Quick command to update DigitalOcean server
# Run: bash RUN_UPDATE.sh

ssh root@138.197.203.235 'cd ~/ongozacyberhub && git pull && bash deploy/quick_update.sh || bash deploy/update_and_restart.sh'
