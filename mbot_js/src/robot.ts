import { Ros, Topic, Service, Vector3 } from 'roslib';
import { LaserScanMessage, OdometryMessage, OccupancyGridMessage, ROSTwist } from './messages';

/**
 * MBot class provides methods to interact with the MBot via ROSBridge using roslibjs.
 * It supports publishing messages, subscribing to topics, and reading data from topics.
 */
class MBot {
  address: string;
  ros: Ros;
  connected: boolean;
  standardSubscribers: {
    odom: Topic<OdometryMessage>;
    scan: Topic<LaserScanMessage>;
    map: Topic<OccupancyGridMessage>;
  };
  standardServices: Record<string, Service<any, any>>;
  standardPublishers: {
    cmd_vel: (msg: ROSTwist) => void;
  };

  /**
   * Initializes the MBot connection to ROSBridge.
   * @param {string} [hostname="localhost"] - The hostname where ROSBridge is running.
   * @param {number} [port=9090] - The port where ROSBridge is running.
   */
  constructor(hostname: string = "localhost", port: number = 9090) {
    this.address = "ws://" + hostname + ":" + port;
    this.ros = new Ros({
      url: this.address
    });

    this.connected = false;
    this.ros.on('connection', () => {
      this.connected = true;
    });

    this.ros.on('error', (error: any) => {
      this.connected = false;
      console.error('Error connecting to ROSBridge:', error);
    });

    this.ros.on('close', () => {
      this.connected = false;
      console.log('Connection to ROSBridge closed');
    });

    this.standardSubscribers = {
      odom: this.registerSubscriber<OdometryMessage>('/odom', 'nav_msgs/Odometry'),
      scan: this.registerSubscriber<LaserScanMessage>('/scan', 'sensor_msgs/LaserScan'),
      map: this.registerSubscriber<OccupancyGridMessage>('/map', 'nav_msgs/OccupancyGrid')
    };
    this.standardServices = {};

    // Construct basic publishers
    this.standardPublishers = {
      cmd_vel: this.createPublisher<ROSTwist>('/mbot/cmd_vel', 'geometry_msgs/Twist')
    };
  }

  /**
   * Creates a ROS publisher for a specific topic.
   * @param {string} topic - The ROS topic to publish to (e.g., '/mbot/cmd_vel').
   * @param {string} dtype - The ROS message type (e.g., 'geometry_msgs/Twist').
   * @returns {Function} A function that takes a message object and publishes it to the topic.
   */
  createPublisher<T = any>(topic: string, dtype: string): (msg: T) => void {
    const publisher = new Topic<T>({
      ros: this.ros,
      name: topic,
      messageType: dtype
    });

    // Return a simple function to publish
    return (msg) => {
      if (!this.connected) {
        console.warn(`Attempting to publish to ${topic} before ROSBridge connection is established.`);
      }
      publisher.publish(msg);
    };
  }

  /**
   * Registers a ROS subscriber for a specific topic.
   * @param {string} topic - The ROS topic to subscribe to.
   * @param {string} dtype - The ROS message type.
   * @param {Function} [callback=null] - Optional callback function to execute when a message is received.
   * @returns {Topic} The ROSLIB listener object.
   */
  registerSubscriber<T = any>(topic: string, dtype: string, callback: ((msg: T) => void) | null = null): Topic<T> {
    const listener = new Topic<T>({
      ros: this.ros,
      name: topic,
      messageType: dtype
    });

    if (callback) {
      listener.subscribe(callback);
    }

    return listener;
  }

  /**
   * Creates a ROS service client.
   * @param {string} service - The name of the ROS service.
   * @param {string} dtype - The ROS service type.
   * @returns {Function} A function that takes a request message and returns a Promise resolving to the service response.
   */
  createService<TRequest = any, TResponse = any>(service: string, dtype: string): (msg: TRequest) => Promise<TResponse> {
    const client = new Service<TRequest, TResponse>({
      ros: this.ros,
      name: service,
      serviceType: dtype
    });

    return (msg: TRequest) => {
      if (!this.connected) {
        console.warn(`Attempting to call service ${service} before ROSBridge connection is established.`);
      }
      return new Promise((resolve, reject) => {
        client.callService(msg, (response: TResponse) => {
          resolve(response);
        }, (error: any) => {
          reject(error);
        });
      });
    };
  }

  /**
   * Drives the MBot using linear and angular velocities.
   * @param {number} vx - Linear velocity in the x-axis (m/s).
   * @param {number} vy - Linear velocity in the y-axis (m/s).
   * @param {number} w - Angular velocity around the z-axis (rad/s).
   */
  drive(vx: number, vy: number, w: number): void {
    const publisher = this.standardPublishers["cmd_vel"];
    publisher({
      linear: new Vector3({
        x: vx,
        y: vy,
        z: 0
      }),
      angular: new Vector3({
        x: 0,
        y: 0,
        z: w
      })
    });
  }

  /**
   * Stops the MBot by publishing zero velocities.
   */
  stop(): void {
    this.drive(0, 0, 0);
  }

  /**
   * Subscribes to the /odom topic.
   * @param {function(OdometryMessage): void} callback - The callback function to execute when an odometry message is received.
   * @returns {Function} A function to unsubscribe the callback.
   */
  readOdom(callback: (msg: OdometryMessage) => void): () => void {
    const wrappedCallback = (msg: any) => {
      callback(new OdometryMessage(msg));
    };
    this.standardSubscribers["odom"].subscribe(wrappedCallback);
    return () => {
      this.standardSubscribers["odom"].unsubscribe(wrappedCallback);
    };
  }

  /**
   * Subscribes to the /scan topic.
   * @param {function(LaserScanMessage): void} callback - The callback function to execute when a laser scan message is received.
   * @returns {Function} A function to unsubscribe the callback.
   */
  readScan(callback: (msg: LaserScanMessage) => void): () => void {
    const wrappedCallback = (msg: any) => {
      callback(new LaserScanMessage(msg));
    };
    this.standardSubscribers["scan"].subscribe(wrappedCallback);
    return () => {
      this.standardSubscribers["scan"].unsubscribe(wrappedCallback);
    };
  }

  /**
   * Subscribes to the /map topic.
   * @param {function(OccupancyGridMessage): void} callback - The callback function to execute when a map message is received.
   * @returns {Function} A function to unsubscribe the callback.
   */
  readMap(callback: (msg: OccupancyGridMessage) => void): () => void {
    const wrappedCallback = (msg: any) => {
      callback(new OccupancyGridMessage(msg));
    };
    this.standardSubscribers["map"].subscribe(wrappedCallback);
    return () => {
      this.standardSubscribers["map"].unsubscribe(wrappedCallback);
    };
  }
}

export { MBot };
