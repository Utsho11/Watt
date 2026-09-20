package com.chargingtracker.watt

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.abs

class BatteryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BatteryModule"

    private val batteryManager: BatteryManager? by lazy {
        reactContext.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
    }

    private var handler: Handler? = null
    private var isTracking = false
    private val pollIntervalMs: Long = 1500L

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (!isTracking) return
            sendBatteryUpdate()
            handler?.postDelayed(this, pollIntervalMs)
        }
    }

    private fun readCurrentBatteryStats(): WritableMap {
        val map = Arguments.createMap()

        val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatusIntent: Intent? = reactContext.registerReceiver(null, intentFilter)

        val rawVoltageMv = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
        val statusInt = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val pluggedInt = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
        val levelInt = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scaleInt = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val tempTenthsC = batteryStatusIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0

        // Battery percentage
        val batteryPct = if (levelInt >= 0 && scaleInt > 0) {
            (levelInt.toFloat() / scaleInt.toFloat()) * 100f
        } else {
            0f
        }

        // Charging status
        val isCharging = statusInt == BatteryManager.BATTERY_STATUS_CHARGING ||
                statusInt == BatteryManager.BATTERY_STATUS_FULL

        val statusString = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
            BatteryManager.BATTERY_STATUS_FULL -> "full"
            BatteryManager.BATTERY_STATUS_DISCHARGING -> "discharging"
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "not_charging"
            else -> "unknown"
        }

        val plugTypeString = when (pluggedInt) {
            BatteryManager.BATTERY_PLUGGED_AC -> "ac"
            BatteryManager.BATTERY_PLUGGED_USB -> "usb"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "wireless"
            else -> "none"
        }

        // Current now: note sign conventions and microamp vs milliamp OEM differences
        val rawCurrent = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW) ?: 0
        val absCurrent = abs(rawCurrent)

        // OEM Quirks Auto-Calibration:
        // Some devices report CURRENT_NOW in mA instead of uA (e.g. 2000 mA instead of 2,000,000 uA).
        // A typical phone charges at 500mA - 12000mA (0.5A - 12A).
        // If the absolute value is < 10,000, it is in mA, so convert to uA by multiplying by 1,000.
        // If >= 10,000, it's already in uA.
        val currentUa: Long = when {
            absCurrent == 0 -> 0L
            absCurrent < 10_000 -> absCurrent.toLong() * 1_000L
            else -> absCurrent.toLong()
        }

        val currentMa = currentUa / 1_000.0
        val voltageVolts = rawVoltageMv / 1_000.0
        val currentAmps = currentUa / 1_000_000.0
        val computedWatts = voltageVolts * currentAmps

        // Temperature: tenths of a degree Celsius (e.g., 345 = 34.5 C)
        val tempCelsius = tempTenthsC / 10.0

        map.putDouble("watts", (Math.round(computedWatts * 100.0) / 100.0))
        map.putBoolean("isCharging", isCharging)
        map.putString("status", statusString)
        map.putString("plugType", plugTypeString)
        map.putInt("voltageMv", rawVoltageMv)
        map.putDouble("voltageV", (Math.round(voltageVolts * 100.0) / 100.0))
        map.putDouble("currentMa", (Math.round(currentMa * 10.0) / 10.0))
        map.putDouble("currentUa", currentUa.toDouble())
        map.putInt("rawCurrent", rawCurrent)
        map.putDouble("batteryLevel", batteryPct.toDouble())
        map.putDouble("temperatureC", tempCelsius)
        map.putDouble("timestamp", System.currentTimeMillis().toDouble())

        return map
    }

    private fun sendBatteryUpdate() {
        if (!reactContext.hasActiveReactInstance()) return
        try {
            val stats = readCurrentBatteryStats()
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onBatteryUpdate", stats)

            // Push updates immediately to Home-Screen Widgets
            BatteryWidgetProvider.updateAllWidgets(
                context = reactContext,
                watts = stats.getDouble("watts"),
                isCharging = stats.getBoolean("isCharging"),
                level = stats.getDouble("batteryLevel").toInt(),
                voltageV = stats.getDouble("voltageV"),
                currentMa = stats.getDouble("currentMa"),
                status = stats.getString("status") ?: "unknown"
            )
        } catch (e: Exception) {
            // Ignore if React instance is not ready or shutting down
        }
    }

    @ReactMethod
    fun startTracking() {
        if (isTracking) return
        isTracking = true
        handler = Handler(Looper.getMainLooper())
        handler?.post(pollRunnable)

        // Start Foreground Service for continuous background tracking & persistent notification
        try {
            val serviceIntent = Intent(reactContext, ChargingForegroundService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent)
            } else {
                reactContext.startService(serviceIntent)
            }
        } catch (e: Exception) {
            // Ignore foreground service launch failure on restricted devices
        }
    }

    @ReactMethod
    fun stopTracking() {
        isTracking = false
        handler?.removeCallbacks(pollRunnable)
        handler = null

        try {
            val serviceIntent = Intent(reactContext, ChargingForegroundService::class.java)
            reactContext.stopService(serviceIntent)
        } catch (e: Exception) {
            // Ignore stop failure
        }
    }

    @ReactMethod
    fun startForegroundTracking() {
        startTracking()
    }

    @ReactMethod
    fun stopForegroundTracking() {
        stopTracking()
    }

    @ReactMethod
    fun getBatteryStats(promise: Promise) {
        try {
            val stats = readCurrentBatteryStats()
            promise.resolve(stats)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }

    // Required for React Native NativeEventEmitter compatibility
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep for NativeEventEmitter support
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep for NativeEventEmitter support
    }
}
