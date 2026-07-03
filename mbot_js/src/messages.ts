import { Quaternion, Vector3, Pose } from 'roslib';

export interface ROSHeader {
  seq: number;
  stamp: { secs: number; nsecs: number };
  frame_id: string;
}

export class LaserScanMessage {
  header: ROSHeader;
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  time_increment: number;
  scan_time: number;
  range_min: number;
  range_max: number;
  ranges: number[];
  intensities: number[];

  constructor(msg: any) {
    this.header = msg.header;
    this.angle_min = msg.angle_min;
    this.angle_max = msg.angle_max;
    this.angle_increment = msg.angle_increment;
    this.time_increment = msg.time_increment;
    this.scan_time = msg.scan_time;
    this.range_min = msg.range_min;
    this.range_max = msg.range_max;
    this.ranges = msg.ranges;
    this.intensities = msg.intensities;
  }

  getAngle(index: number): number {
    return this.angle_min + index * this.angle_increment;
  }
}

export interface ROSTwist {
  linear: Vector3;
  angular: Vector3;
}

export class OdometryMessage {
  header: ROSHeader;
  child_frame_id: string;
  pose: {
    pose: Pose;
    covariance: number[];
  };
  twist: {
    twist: ROSTwist;
    covariance: number[];
  };

  constructor(msg: any) {
    this.header = msg.header;
    this.child_frame_id = msg.child_frame_id;
    this.pose = msg.pose;
    this.twist = msg.twist;
  }

  get x(): number { return this.pose.pose.position.x; }
  get y(): number { return this.pose.pose.position.y; }
  get z(): number { return this.pose.pose.position.z; }

  get tx(): number { return this.twist.twist.linear.x; }
  get ty(): number { return this.twist.twist.linear.y; }
  get tz(): number { return this.twist.twist.linear.z; }
}

export interface MapMetaData {
  map_load_time: { secs: number; nsecs: number };
  resolution: number;
  width: number;
  height: number;
  origin: Pose;
}

export class OccupancyGridMessage {
  header: ROSHeader;
  info: MapMetaData;
  data: number[];

  constructor(msg: any) {
    this.header = msg.header;
    this.info = msg.info;
    this.data = msg.data;
  }

  getCell(x: number, y: number): number {
    if (x < 0 || x >= this.info.width || y < 0 || y >= this.info.height) {
      return -1;
    }
    return this.data[y * this.info.width + x];
  }
}
