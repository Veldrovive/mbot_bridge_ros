# MBot Bridge ROS

This repository contains the ROS 2 components for the MBot Bridge, including a bundled version of `rosbridge_suite` as a submodule.

## Prerequisites

- ROS 2 (Jazzy) installed
- `colcon` and `rosdep` installed
- python 3.10-3.13 (3.14 currently fails due to pkg_resources deprecation)

## Building from Source

First, ensure you clone the repository with submodules (or initialize them if you have already cloned it):

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/Veldrovive/mbot_bridge_ros.git
cd mbot_bridge_ros

# Or if already cloned without submodules:
# git submodule update --init --recursive
```

Then, from the root of the repository, navigate to the workspace directory to install dependencies and build:

```bash
cd ws
rosdep update
rosdep install --from-paths src --ignore-src -r -y
colcon build
```

## Running the Server

After successfully building the workspace, you can source it and launch the websocket server:

```bash
# Assuming you are still in the `ws` directory
source install/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

## Running as a Service (Systemd)

To run the ROS bridge automatically in the background, you can set it up as a systemd service using the provided files in the `services/` directory.

1. Verify the `services/mbot_bridge_ros.service` file has the correct path in `ExecStart`. (The default assumes the repository is cloned to `/home/mbot/mbot_bridge_ros`).

2. Run the installation script:
   ```bash
   sudo ./services/install_ros_bridge_service.sh
   ```

This script will automatically copy the service file, reload the systemd daemon, and enable/start the service.
