# Charging Wattage Tracker — Guideline & Implementation Plan

## 1. Scope & Decisions

- **Platform**: Android-only for real wattage data (iOS blocks access to charging current/voltage for third-party apps — only charging state is available).
- **Stack**: React Native (Expo, bare/dev-client workflow) + a custom Kotlin native module for battery data + `react-native-reanimated`/`react-native-skia` for the animation layer.
- **Output**: Live watts (V × A), a charging history log, and an animated visual that reacts to live wattage in real time.
- **No backend required** for v1 — everything is on-device. A backend is only needed later if you want cloud sync/history across devices (your usual Node/TypeScript/MongoDB stack covers that).

---

## 2. Architecture Overview

```
┌─────────────────────────────┐
│        React Native UI       │
│  (screens, animation layer)  │
└──────────────┬───────────────┘
               │ NativeEventEmitter
┌──────────────▼───────────────┐
│   Kotlin Native Module        │
│  (BatteryManager polling)     │
└──────────────┬───────────────┘
               │ Android APIs
┌──────────────▼───────────────┐
│  BatteryManager / Intent      │
│  ACTION_BATTERY_CHANGED       │
└───────────────────────────────┘
```

- **Data layer**: Kotlin module reads `BatteryManager.EXTRA_VOLTAGE` and `BatteryManager.EXTRA_CURRENT_NOW` (or `getIntProperty(BATTERY_PROPERTY_CURRENT_NOW)`), computes watts = (V × A) / 1,000,000, and emits events to JS every 1–2 seconds.
- **State layer**: RN context/hook stores the latest reading + a rolling buffer (e.g. last 60 readings) for smoothing and history charts.
- **UI layer**: Animation component subscribes to the live watt value and drives visual intensity (particle speed, glow, fill level, etc.) off it.

---

## 3. Project Setup

1. `npx create-expo-app charging-tracker --template` → choose blank TypeScript template.
2. Switch to a **dev client** build since you need custom native code:
   ```
   npx expo install expo-dev-client
   npx expo prebuild
   ```
3. Add native module folder: `android/app/src/main/java/.../BatteryModule.kt`
4. Register the module in `MainApplication.kt`'s package list.
5. Install animation libs:
   ```
   npx expo install react-native-reanimated
   npx expo install @shopify/react-native-skia
   # optional, if using pre-made Lottie animations instead of custom Skia
   npx expo install lottie-react-native
   ```
6. Build a dev client on a physical Android device (emulators don't report real battery current — you need real hardware for testing).

---

## 4. Native Module (Kotlin) — Core Logic

```kotlin
class BatteryModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BatteryModule"

    private val batteryManager = reactContext.getSystemService(
        Context.BATTERY_SERVICE
    ) as BatteryManager

    private var handler: Handler? = null
    private val pollRunnable = object : Runnable {
        override fun run() {
            val microAmps = batteryManager.getIntProperty(
                BatteryManager.BATTERY_PROPERTY_CURRENT_NOW
            )
            val intent = reactApplicationContext.registerReceiver(
                null, IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            )
            val voltage = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
            val isCharging = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                .let { it == BatteryManager.BATTERY_STATUS_CHARGING }

            val watts = (voltage / 1000.0) * (Math.abs(microAmps) / 1_000_000.0)

            val params = Arguments.createMap().apply {
                putDouble("watts", watts)
                putBoolean("isCharging", isCharging)
                putInt("voltageMv", voltage)
                putInt("currentUa", microAmps)
            }

            reactApplicationContext
                .getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("onBatteryUpdate", params)

            handler?.postDelayed(this, 1500) // poll every 1.5s
        }
    }

    @ReactMethod
    fun startTracking() {
        handler = Handler(Looper.getMainLooper())
        handler?.post(pollRunnable)
    }

    @ReactMethod
    fun stopTracking() {
        handler?.removeCallbacks(pollRunnable)
    }
}
```

> Note: some devices report `CURRENT_NOW` in mA instead of µA, and sign conventions (+/-) vary by OEM — build in a calibration/sanity-check step (see Section 7).

---

## 5. JS/TS Bridge Hook

```typescript
import { NativeEventEmitter, NativeModules } from 'react-native';

const { BatteryModule } = NativeModules;
const batteryEmitter = new NativeEventEmitter(BatteryModule);

export function useChargingStats() {
  const [watts, setWatts] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    BatteryModule.startTracking();
    const sub = batteryEmitter.addListener('onBatteryUpdate', (data) => {
      setWatts(data.watts);
      setIsCharging(data.isCharging);
    });
    return () => {
      sub.remove();
      BatteryModule.stopTracking();
    };
  }, []);

  return { watts, isCharging };
}
```

---

## 6. Live Widget / Home-Screen Visibility

Standard Android widgets are rate-limited by the OS (~30 min minimum update interval by default) to prevent battery drain, so a home-screen widget can't tick live wattage every second the way an in-app screen can. Use a combination of two pieces:

### 6a. Foreground Service + Persistent Notification (truly live)
- Run a **foreground service** (needed anyway so tracking survives the app being backgrounded) that polls `BatteryManager` every 1–2s.
- Push updates into a persistent, low-priority notification (similar to music-player notifications) showing current watts — this is the part that feels genuinely real-time.
- Required manifest pieces: `FOREGROUND_SERVICE` permission (and `FOREGROUND_SERVICE_SPECIAL_USE` or an appropriate type on newer Android versions), a `NotificationChannel`, and a bound/started service that the RN native module can start/stop alongside `startTracking()`/`stopTracking()`.

### 6b. Home-Screen Widget (near-live, not real-time)
- Build with **Jetpack Glance** (modern Compose-style widget API) rather than legacy `AppWidgetProvider` XML — easier to keep in sync with a Kotlin/Compose-based data layer.
- Show last-known watts + charging state icon (static icon or a small set of animation frames, not a full live animation — widgets don't support arbitrary continuous animation).
- Bypass the default scheduler by having the **foreground service call `AppWidgetManager.updateAppWidget()` directly** whenever it gets a new reading, instead of relying on `updatePeriodicMillis`. This can refresh every few seconds while actively charging, though Android's Doze mode may still throttle it if the screen is off/device is idle.

### Recommended combo
Foreground service + notification for the "watch it change live" experience, plus a Glance widget for "check without opening the app." Treat the widget as best-effort/near-live rather than promising second-by-second accuracy — that's an OS-level constraint, not an implementation gap.

### 6c. Widget Sizing (1×1 and 2×2)
Android's cell-to-dp sizing is roughly `70dp × cells − 30dp`, so a 1×1 cell gives ~40×40dp of usable space — enough for a number + icon, not for animation or multi-line text. Offer both a compact 1×1 and a larger 2×2 via resizable Glance config so users can pick their detail level:

- **1×1**: watts value + small static icon only (e.g. "18W" + bolt icon).
- **2×2**: watts value + a simple progress ring/battery fill (basic shape/progress indicator, not full animation) + charging state text.

Example `AppWidgetProviderInfo` (`res/xml/battery_widget_info.xml`):
```xml
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="40dp"
    android:minHeight="40dp"
    android:targetCellWidth="1"
    android:targetCellHeight="1"
    android:maxResizeWidth="110dp"
    android:maxResizeHeight="110dp"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:updatePeriodMillis="1800000" />
```

In the Glance composable, branch layout on the widget's current `LocalSize.current`:
```kotlin
@Composable
fun BatteryWidgetContent(watts: Double, isCharging: Boolean) {
    val size = LocalSize.current
    if (size.width < 90.dp) {
        // 1x1 compact layout: value + icon only
        Text("${watts.toInt()}W", style = compactTextStyle)
    } else {
        // 2x2+ layout: value + progress ring + state text
        Column {
            CircularProgressRing(progress = (watts / maxExpectedWatts).toFloat())
            Text("${watts.toInt()}W")
            Text(if (isCharging) "Charging" else "Idle")
        }
    }
}
```
`updatePeriodMillis` stays as the OS-level fallback (system minimum ~30 min); actual near-live refresh still comes from the foreground service calling `AppWidgetManager.updateAppWidget()` directly, as described in 6b.

---

## 7. Animation Layer

Two viable approaches — pick based on how custom you want the visual:

**A. Skia (fully custom, most flexible)**
- Draw a circular/liquid-fill gauge that reacts to `watts` in real time.
- Use `useDerivedValue` (Reanimated) to smooth the raw watt value into an animated shared value, then drive Skia path/opacity/radius off it.
- Good for: pulsing glow rings, particle bursts scaling with wattage, liquid-fill battery icon.

**B. Lottie (fast to ship, less custom)**
- Design/source a looping "charging" animation (e.g. energy bolt, flowing particles) in After Effects → export as Lottie JSON.
- Control playback speed via `progress` or `speed` prop bound to normalized wattage (e.g. `speed = watts / maxExpectedWatts`).
- Good for: quick MVP, less native animation code to maintain.

**Recommendation**: Start with Lottie for the MVP animation to validate the data pipeline works end-to-end, then swap in a Skia custom animation once the core tracking is solid — don't build the fancy visual before the data is reliable.

---

## 8. Data Reliability Notes (important, easy to get wrong)

- **Sign convention**: Some OEMs report negative current while charging, others positive — always use `Math.abs()` and rely on `EXTRA_STATUS` for charging/discharging state, not the sign.
- **Units**: `CURRENT_NOW` is usually µA but has been seen as mA on some devices — sanity-check against expected charger wattage (e.g. a 20W charger shouldn't compute to 2000W; if it does, you're off by 1000x).
- **Smoothing**: Raw readings can be noisy — apply a rolling average (last 5–10 samples) before feeding the animation, so the visual doesn't jitter.
- **Polling interval**: 1–2 seconds is enough for a live feel without draining battery on the tracking itself.

---

## 9. Feature Roadmap

| Phase | Features |
|---|---|
| **MVP (v1)** | Live watt reading, charging/not-charging state, basic animation (Lottie), simple numeric display |
| **v1.1** | Charging history log (session start/end, avg watts, energy in Wh), rolling smoothing |
| **v1.2** | Custom Skia animation, theming, charger-type detection (fast charge vs. standard) if exposed |
| **v1.3** | Foreground service + live notification, Jetpack Glance home-screen widget |
| **v2** | Notifications (e.g. "charging slowed down"), optional cloud sync/backup |

---

## 10. Testing Plan

- Test on **at least 2–3 different physical Android devices/OEMs** (Samsung, Xiaomi, Pixel) — `BatteryManager` behavior varies notably by manufacturer.
- Test with different chargers (5W, 18W, 25W+, wireless if supported) to confirm wattage scales sensibly.
- Test animation performance on a lower-end device to make sure the polling + render loop doesn't itself cause jank or noticeable battery drain.

---

## 11. Suggested Milestones

1. Native module reads and logs raw battery data to console — validate numbers make sense.
2. Bridge data to JS, display raw watts as plain text.
3. Add smoothing + basic Lottie animation bound to watts.
4. Add charging session history (local storage, e.g. `expo-sqlite` or `AsyncStorage`).
5. Polish animation (Skia) + UI.
6. Test across devices, calibrate for OEM quirks.
