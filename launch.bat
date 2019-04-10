@echo off
IF NOT EXIST ./node_modules/auto-updater (npm i --loglevel=error)
title VKCoinX - Batch Script
node index.js
echo Bot was forced to exit . . .
pause
)
