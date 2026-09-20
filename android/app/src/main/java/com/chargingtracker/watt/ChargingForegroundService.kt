package com.chargingtracker.watt

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.chargingtracker.watt.R
import java.util.Locale
import kotlin.math.abs

class ChargingForegroundService : Service() {

    private val channelId = "charging_wattage_channel"
    private val notificationId = 1001
    private var handler: Handler? = null
    private var isRunning = false
    private val pollIntervalMs = 1500L

    private val batteryManager: BatteryManager? by lazy {
        getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
    }

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) return
            updateNotificationAndWidgets()
            handler?.postDelayed(this, pollIntervalMs)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            val initialNotification = buildNotification("Monitoring battery...", "Starting live wattage tracking")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(notificationId, initialNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(notificationId, initialNotification)
            }

            handler = Handler(Looper.getMainLooper())
            handler?.post(pollRunnable)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        handler?.removeCallbacks(pollRunnable)
        handler = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Live Charging Wattage"
            val descriptionText = "Displays real-time charging wattage and battery metrics"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(channelId, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotificationAndWidgets() {
        try {
            val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val intent: Intent? = registerReceiver(null, intentFilter)

            val rawVoltageMv = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
            val statusInt = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val levelInt = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scaleInt = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100

            val isCharging = statusInt == BatteryManager.BATTERY_STATUS_CHARGING ||
                    statusInt == BatteryManager.BATTERY_STATUS_FULL

            val batteryPct = if (levelInt >= 0 && scaleInt > 0) {
                ((levelInt.toFloat() / scaleInt.toFloat()) * 100f).toInt()
            } else 0

            val rawCurrent = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW) ?: 0
            val absCurrent = abs(rawCurrent)

            val currentUa: Long = when {
                absCurrent == 0 -> 0L
                absCurrent < 10_000 -> absCurrent.toLong() * 1_000L
                else -> absCurrent.toLong()
            }

            val currentMa = currentUa / 1_000.0
            val voltageVolts = rawVoltageMv / 1_000.0
            val watts = voltageVolts * (currentUa / 1_000_000.0)

            // Update Notification
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val title = if (isCharging) {
                "⚡ ${String.format(Locale.US, "%.1f", watts)} W — Charging"
            } else {
                "🔋 ${batteryPct}% — Battery"
            }

            val subtitle = if (isCharging) {
                "${batteryPct}% • ${String.format(Locale.US, "%.2f", voltageVolts)}V • ${currentMa.toInt()} mA"
            } else {
                "Not charging (${String.format(Locale.US, "%.2f", voltageVolts)}V)"
            }

            val updatedNotification = buildNotification(title, subtitle)
            notificationManager.notify(notificationId, updatedNotification)

            // Update Home Screen Widgets!
            BatteryWidgetProvider.updateAllWidgets(
                context = this,
                watts = watts,
                isCharging = isCharging,
                level = batteryPct,
                voltageV = voltageVolts,
                currentMa = currentMa,
                status = if (isCharging) "charging" else "discharging"
            )

        } catch (e: Exception) {
            // Ignore background reading errors
        }
    }
}
