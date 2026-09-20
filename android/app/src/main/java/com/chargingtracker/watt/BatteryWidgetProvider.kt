package com.chargingtracker.watt

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews

open class BatteryWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Initial refresh on placement
        updateAllWidgets(context)
    }

    companion object {
        fun updateAllWidgets(
            context: Context,
            watts: Double = 0.0,
            isCharging: Boolean = false,
            level: Int = 0,
            voltageV: Double = 0.0,
            currentMa: Double = 0.0,
            status: String = "unknown"
        ) {
            val appWidgetManager = AppWidgetManager.getInstance(context)

            // Intent to open app when widget is tapped
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // 1. Update 1x1 Widgets
            val widget1x1Component = ComponentName(context, BatteryWidgetProvider1x1::class.java)
            val ids1x1 = appWidgetManager.getAppWidgetIds(widget1x1Component)
            if (ids1x1.isNotEmpty()) {
                val views1x1 = RemoteViews(context.packageName, R.layout.widget_battery_1x1)
                views1x1.setOnClickPendingIntent(R.id.widget_1x1_root, pendingIntent)

                val wattText = if (isCharging) "${String.format("%.1f", watts)}W" else "0W"
                views1x1.setTextViewText(R.id.widget_1x1_watts, wattText)
                views1x1.setTextViewText(R.id.widget_1x1_level, "$level%")
                views1x1.setTextViewText(
                    R.id.widget_1x1_icon,
                    if (isCharging) "⚡" else "🔋"
                )
                views1x1.setTextColor(
                    R.id.widget_1x1_icon,
                    if (isCharging) Color.parseColor("#10B981") else Color.parseColor("#64748B")
                )

                appWidgetManager.updateAppWidget(ids1x1, views1x1)
            }

            // 2. Update 2x2 Widgets
            val widget2x2Component = ComponentName(context, BatteryWidgetProvider2x2::class.java)
            val ids2x2 = appWidgetManager.getAppWidgetIds(widget2x2Component)
            if (ids2x2.isNotEmpty()) {
                val views2x2 = RemoteViews(context.packageName, R.layout.widget_battery_2x2)
                views2x2.setOnClickPendingIntent(R.id.widget_2x2_root, pendingIntent)

                val wattText = if (isCharging) String.format("%.1f", watts) else "0.0"
                views2x2.setTextViewText(R.id.widget_2x2_watts, wattText)
                views2x2.setTextViewText(R.id.widget_2x2_level, "$level%")
                views2x2.setProgressBar(R.id.widget_2x2_progress, 100, level, false)

                val badgeText = when {
                    !isCharging -> "DISCHARGING"
                    watts >= 45.0 -> "TURBO CHARGE"
                    watts >= 25.0 -> "SUPER CHARGE"
                    watts >= 10.0 -> "FAST CHARGE"
                    else -> "CHARGING"
                }
                val badgeColor = when {
                    !isCharging -> Color.parseColor("#94A3B8")
                    watts >= 45.0 -> Color.parseColor("#EC4899")
                    watts >= 25.0 -> Color.parseColor("#F59E0B")
                    else -> Color.parseColor("#10B981")
                }

                views2x2.setTextViewText(R.id.widget_2x2_badge, badgeText)
                views2x2.setTextColor(R.id.widget_2x2_badge, badgeColor)

                val voltText = if (voltageV > 0) "${String.format("%.2f", voltageV)} V" else "-- V"
                val currText = if (currentMa != 0.0) "${Math.abs(currentMa).toInt()} mA" else "-- mA"
                views2x2.setTextViewText(R.id.widget_2x2_voltage, voltText)
                views2x2.setTextViewText(R.id.widget_2x2_current, currText)

                appWidgetManager.updateAppWidget(ids2x2, views2x2)
            }
        }
    }
}

class BatteryWidgetProvider1x1 : BatteryWidgetProvider()
class BatteryWidgetProvider2x2 : BatteryWidgetProvider()
