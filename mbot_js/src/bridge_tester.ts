import { MBot } from './robot';
import { OdometryMessage, LaserScanMessage, OccupancyGridMessage, PathMessage } from './messages';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSubscribers(mbot: MBot) {
  const timeoutMs = 5000;

  const subscribers = [
    { name: '/odom', reader: (cb: any) => mbot.readOdom(cb) },
    { name: '/scan', reader: (cb: any) => mbot.readScan(cb) },
    { name: '/map', reader: (cb: any) => mbot.readMap(cb) },
    { name: '/plan', reader: (cb: any) => mbot.readPath(cb) }
  ];

  for (const sub of subscribers) {
    console.log(`\n--- Testing Subscriber: ${sub.name} ---`);
    await new Promise<void>((resolve) => {
      let received = false;
      let unsubscribe: () => void;

      const timeoutId = setTimeout(() => {
        if (!received) {
          console.log(`\x1b[31m[FAILED] No data received for ${sub.name} within ${timeoutMs}ms\x1b[0m`);
          if (unsubscribe) unsubscribe();
          resolve();
        }
      }, timeoutMs);

      unsubscribe = sub.reader((msg: any) => {
        if (!received) {
          received = true;
          clearTimeout(timeoutId);
          console.log(`\x1b[32m[SUCCESS] Received data for ${sub.name}:\x1b[0m`);

          if (sub.name === '/odom') {
            // then msg is of type OdometryMessage
            const odomMsg = msg as OdometryMessage
            console.log(odomMsg.x, odomMsg.y, odomMsg.theta);
            console.log(`  Position: x=${odomMsg.x || 'N/A'}, y=${odomMsg.y || 'N/A'}, theta=${odomMsg.theta || 'N/A'}`);
          } else if (sub.name === '/scan') {
            const scanMsg = msg as LaserScanMessage;
            console.log(`  Ranges: ${scanMsg.ranges?.length} readings`);
          } else if (sub.name === '/map') {
            const mapMsg = msg as OccupancyGridMessage;
            console.log(`  Map Info: ${mapMsg.info?.width}x${mapMsg.info?.height}, resolution: ${mapMsg.info?.resolution}`);
          } else if (sub.name === '/plan') {
            const pathMsg = msg as PathMessage;
            console.log(`  Path: ${pathMsg.poses?.length} poses`);
          } else {
            console.log(msg);
          }

          unsubscribe();
          resolve();
        }
      });
    });
  }
}

async function testPublishers(mbot: MBot) {
  console.log(`\n--- Testing Publisher: cmd_vel ---`);
  const vel = 0.5;

  console.log(`1. Testing publishCmdVel (vx=${vel}) (Single message)`);
  mbot.publishCmdVel(vel, 0, 0);
  await wait(1000);

  console.log(`2. Testing drive (vx=${vel}) for 3 seconds using Promise...`);
  const drivePromise = mbot.drive(vel, 0, 0, 3000);
  const completed = await drivePromise;
  console.log(`   Promise resolved with: ${completed} (expected: true)`);

  console.log(`3. Testing driveForever (vx=${vel}), wait 2s, then stop...`);
  mbot.driveForever(vel, 0, 0);
  await wait(2000);
  mbot.stop();
  console.log(`   Called stop().`);

  console.log(`4. Testing drive interruption...`);
  const drivePromise2 = mbot.drive(vel, 0, 0, 5000);
  await wait(1000);
  console.log(`   Interrupting with stop() before 5s timeout...`);
  mbot.stop();
  const completed2 = await drivePromise2;
  console.log(`   Promise resolved with: ${completed2} (expected: false)`);

  console.log(`\x1b[32m[SUCCESS] Publisher cmd_vel test completed.\x1b[0m`);
}

async function main() {
  const hostname = process.argv[2] || 'localhost';
  const port = parseInt(process.argv[3]) || 9090;

  console.log(`Connecting to ROS Bridge at ws://${hostname}:${port}...`);
  const mbot = new MBot(hostname, port);

  await wait(1000); // Give it a moment to connect

  if (!mbot.connected) {
    console.warn(`\x1b[33m[WARNING] MBot connected flag is false after 1s. Ensure ROS Bridge is running. Proceeding with tests...\x1b[0m`);
  } else {
    console.log(`\x1b[32m[SUCCESS] Connected to ROS Bridge.\x1b[0m`);
  }

  await testPublishers(mbot);
  await testSubscribers(mbot);

  console.log(`\nAll tests finished. Exiting...`);

  // Exit explicitly as roslib might keep the process alive
  process.exit(0);
}

main();
