# Watt Tracker ⚡

**Real-Time Android Charging Wattage & Battery Telemetry Tracker**

A React Native & Expo application powered by a custom Kotlin native module that measures live charging wattage (\(V \times A\)), provides reactive 60fps animations driven by live charging speed, tracks detailed charging session histories (accumulated energy in \(Wh\), peak watts, duration), and auto-calibrates for OEM hardware quirks.

---

## ✨ Features

- **⚡ Live Wattage Measurement**: True real-time wattage calculated via Android `BatteryManager` and `Intent.ACTION_BATTERY_CHANGED`.
- **🎨 Reactive UI & Animations**: Powered by `react-native-reanimated`. Energy rings and pulse frequency dynamically react and accelerate as wattage increases.
- **🏷️ Smart Tier Detection**: Automatically classifies charging speeds into Standard (5W), Fast Charge (15–18W QC), Super Charge (25–33W PD), and Turbo Hyper Charge (65W–120W GaN).
- **📊 Real-time Hardware Telemetry**: Live cards for Voltage (\(V\) and \(mV\)), Current (\(mA\) and \(A\)), Battery Percentage, and Battery Temperature (°C).
- **🔋 Charging Session Logs**: Records session duration, start/end battery %, total energy delivered in Watt-hours (\(Wh\)), peak watts, and average watts. Persisted locally via `@react-native-async-storage/async-storage`.
- **🛠️ OEM Quirks Auto-Calibration**: Automatically detects \(\mu\text{A}\) vs \(\text{mA}\) reporting differences across Samsung, Xiaomi, OnePlus, Pixel, and Sony devices.
- **🧪 Built-In Simulation Mode**: Allows instant testing of all charging profiles and animations even in emulators, browsers, or offline.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Native UI                      │
│  - Live Wattage Hero (Reanimated Reactive Pulse/Ring)  │
│  - Real-time Metrics (Voltage, Current, Temp, Source)  │
│  - Active Session Tracker (Duration, Wh, Peak W)       │
│  - Charging History Log & Session Cards                │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                    useChargingStats                    │
│  - Rolling Average Smoothing Buffer (8 samples)        │
│  - Session Lifecycle Manager (Wh accumulation)         │
│  - Local Persistence (@react-native-async-storage)     │
│  - Hardware / Simulation Fallback Adapter              │
└───────────────────────────▲────────────────────────────┘
                            │ NativeEventEmitter ("onBatteryUpdate")
┌───────────────────────────┴────────────────────────────┐
│              BatteryModule (Kotlin Native)             │
│  - BatteryManager polling (every 1.5s)                 │
│  - ACTION_BATTERY_CHANGED (voltage, status, temp)      │
│  - BATTERY_PROPERTY_CURRENT_NOW (microAmps / mA check) │
│  - Real Wattage Calculation: (V/1000) * (Math.abs(A))  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Browser (Web / Simulator Preview)
```bash
npm run web
```

### 3. Run on Physical Android Device (Dev Client)
```bash
npm run android
```

---

## 📦 Building Standalone APK

### Cloud Build via EAS (Recommended)
```bash
# 1. Login to your Expo account
npx eas login

# 2. Build direct APK
npx eas build -p android --profile preview
```

### Local Build with Gradle (Requires JDK 17 & Android SDK)
```bash
cd android
./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📄 License
MIT License.
