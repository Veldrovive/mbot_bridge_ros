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
This is the core bringup for the main ros2 stack
https://github.com/mbot-project/mbot_ros2_ws/blob/main/mbot_bringup/launch/mbot_bringup.launch.py
```python
#!/usr/bin/env python3
"""
Launches the core nodes for the MBot, including robot description and lidar drivers.
"""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
import xacro

def generate_launch_description():
    # ----- Package Directories -----
    pkg_mbot_description = get_package_share_directory('mbot_description')
    pkg_sllidar_ros2 = get_package_share_directory('sllidar_ros2') 
    
    # ----- Launch Arguments -----
    use_sim_time = LaunchConfiguration('use_sim_time')
    
    # ----- Robot Description -----
    urdf_file = os.path.join(pkg_mbot_description, 'urdf', 'mbot_classic.urdf.xacro')
    robot_desc = xacro.process_file(urdf_file).toxml()

    # ----- Node & Launch File Definitions -----
    
    # 1. Robot State Publisher
    robot_state_publisher_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
            'robot_description': robot_desc
        }]
    )
    
    # 2. Joint State Publisher
    joint_state_publisher_node = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        output='screen',
        parameters=[{'use_sim_time': use_sim_time}]
    )

    # 3. Lidar Launch File Inclusion
    lidar_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_sllidar_ros2, 'launch', 'sllidar_a1_launch.py')
        ),
        # Pass the frame_id argument to the included launch file
        launch_arguments={'frame_id': 'lidar_link'}.items()
    )
    
    return LaunchDescription([
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation clock instead of system clock'),
        
        robot_state_publisher_node,
        joint_state_publisher_node,
        lidar_launch
    ])
```

## SLAM
[mbot_navigation/launch/slam_toolbox_online_async_launch.py](https://github.com/mbot-project/mbot_ros2_ws/blob/main/mbot_navigation/launch/slam_toolbox_online_async_launch.py)


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

https://robotwebtools.github.io/roslibjs/ is the docs for the roslibjs which is actually used to interface with rosbridge.
This https://wiki.ros.org/roslibjs/Tutorials/BasicRosFunctionality is basic documentation.

I want to have my standard subscribers have functions available to easily convert the raw messages into types that are more useful for downstream code.