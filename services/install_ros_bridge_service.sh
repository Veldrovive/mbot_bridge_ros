#!/bin/bash

# Ensure the script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with sudo:"
  echo "sudo $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="${SCRIPT_DIR}/mbot_bridge_ros.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "Error: Service file not found at $SERVICE_FILE"
    exit 1
fi

echo "Copying service file to /etc/systemd/system/..."
cp "$SERVICE_FILE" /etc/systemd/system/

echo "Reloading systemd daemon..."
systemctl daemon-reload

echo "Enabling mbot_bridge_ros.service..."
systemctl enable mbot_bridge_ros.service

echo "Starting mbot_bridge_ros.service..."
systemctl start mbot_bridge_ros.service

echo "Done! You can check the status with:"
echo "sudo systemctl status mbot_bridge_ros.service"
