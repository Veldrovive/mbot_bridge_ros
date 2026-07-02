# Rosbridge
There is a preexisting `rosbridge_suite` (https://wiki.ros.org/rosbridge_suite) implementation that we can use instead of writing our own.

This hosts a websocket server like the original server.py does so we can just write a client layer on top of this for each language.

Install:
```bash
sudo apt-get update
sudo apt-get install ros-$ROS_DISTRO-rosbridge-server
```

Run:
```bash
source /opt/ros/$ROS_DISTRO/setup.bash
roslaunch rosbridge_server rosbridge_websocket.launch
```

Install from source:
```bash
cd ~
mkdir -p workspace/src
cd workspace/src

gh repo clone RobotWebTools/rosbridge_suite
cd rosbridge_suite
git switch $ROS_DISTRO
source /opt/ros/$ROS_DISTRO/setup.bash

cd ~/workspace
rosdep update
rosdep install --from-paths src --ignore-src -r -y

colcon build
source install/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

Needs to be updated along with any ros upgrades.

I now included this as a submodule in `mbot_bridge_ros/ws/src/rosbridge_suite`.

# LIDAR



# Bridges
## JS
The original has methods:
Constructor: takes the hostname and port
_read: Connects to the server, sends a message, and receives a single response before closing the connection.
publish: Connects to the server, sends a single message, and closes the connection.
subscribe: Opens a connections, sends a subscribe request, and then leaves it open.
unsubscribe: Closes the connection.

Higher level functions:
readOdometry: Calls _read on the odometry channel.
readMap: Calls _read on the map channel.
drive: Calls _publish on the motor velocity channel.
stop: Calls _publish on the motor velocity channel with 0, 0.
resetSLAM: Calls _publish on the reset odometry channel.

These are very... odd. They don't seem to be be using the websocket server as a websocket for the most part. We'll have to see how `rosbridge_suite` does stuff, but I imagine it works much more like a websocket should.

