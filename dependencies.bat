@echo off
echo Installing dotenv...
npm install dotenv && ^
echo Installing @builderbot/bot... && ^
npm install @builderbot/bot && ^
echo Installing @builderbot/database-mongo... && ^
npm install @builderbot/database-mongo && ^
echo Installing @builderbot/provider-baileys, uuid, and axios... && ^
npm install @builderbot/provider-baileys uuid axios && ^
echo Installing sharp with optional dependencies... && ^
npm install --include=optional sharp && ^
echo Installing sharp for win32 x64... && ^
npm install --os=win32 --cpu=x64 sharp && ^
echo Installing sharp for wasm32... && ^
npm install --cpu=wasm32 sharp

echo All dependencies installed.
pause
