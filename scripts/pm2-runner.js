#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const command = process.argv[2] || 'start';
const rootDir = path.resolve(__dirname, '..');

console.log(`\n🚀 Sepolia Health PM2 Manager\n`);

switch(command) {
  case 'start':
    console.log('Starting backend and frontend...');
    exec(`pm2 start "${rootDir}/ecosystem.js"`, { cwd: rootDir }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      console.log(stdout);
      console.log('\n✅ Started successfully!');
      console.log('\n📊 Check status with: npm run pm2 status');
      console.log('📋 View logs with: npm run pm2 logs');
    });
    break;

  case 'stop':
    console.log('Stopping all processes...');
    exec('pm2 delete all', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      console.log(stdout);
      console.log('\n✅ Stopped successfully!');
    });
    break;

  case 'restart':
    console.log('Restarting all processes...');
    exec('pm2 restart all', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      console.log(stdout);
      console.log('\n✅ Restarted successfully!');
    });
    break;

  case 'status':
    console.log('Current status:');
    exec('pm2 status', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      console.log(stdout);
    });
    break;

  case 'logs':
    console.log('Showing logs...');
    exec('pm2 logs', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      console.log(stdout);
    });
    break;

  default:
    console.log('\nUsage: npm run pm2 [command]');
    console.log('\nCommands:');
    console.log('  start    - Start backend and frontend');
    console.log('  stop     - Stop all processes');
    console.log('  restart  - Restart all processes');
    console.log('  status   - Show current status');
    console.log('  logs     - Show logs');
    console.log('\nExamples:');
    console.log('  npm run pm2 start');
    console.log('  npm run pm2 status');
    break;
}