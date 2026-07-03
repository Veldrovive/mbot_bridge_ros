#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")/ws"

# Source ROS 2 and the workspace
source /opt/ros/jazzy/setup.bash
source "${WS_DIR}/install/setup.bash"

# Launch the rosbridge server
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
