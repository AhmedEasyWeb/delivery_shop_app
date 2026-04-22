package online.webmadeeasy.delivery_shop;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.app.PendingIntent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class DriverWebSocketService extends Service {

    private static final String TAG = "DriverWsService";
    public static final String WS_URL = "wss://deliveryshop.cloud";

    private static final String CHANNEL_ID = "driver_ws_channel";
    private static final String ALERT_CHANNEL_ID = "driver_alert_channel";
    private static final int NOTIFICATION_ID = 202;
    private static final int ALERT_NOTIFICATION_ID = 203;
    private static final int HEARTBEAT_INTERVAL_SEC = 25;
    private static final int RECONNECT_DELAY_MS = 3000;
    private static final double MOVEMENT_THRESHOLD = 0.00015;

    // Intent action extras
    public static final String ACTION_GO_ONLINE  = "GO_ONLINE";
    public static final String ACTION_GO_OFFLINE = "GO_OFFLINE";
    public static final String ACTION_SEND_FREE_DRIVER    = "SEND_FREE_DRIVER";
    public static final String ACTION_SEND_UPDATE_ORDERS  = "SEND_UPDATE_ORDERS";
    public static final String ACTION_CHANGE_CITY         = "CHANGE_CITY";
    public static final String ACTION_UPDATE_LOCATION     = "UPDATE_LOCATION";
    public static final String ACTION_UPDATE_ORDERS_LIST  = "UPDATE_ORDERS_LIST";

    // Broadcast action JS listens to via plugin
    public static final String BROADCAST_WS_EVENT = "online.webmadeeasy.delivery_shop.WS_EVENT";

    // ── State ────────────────────────────────────────────────────────────────
    private OkHttpClient httpClient;
    private WebSocket webSocket;
    private boolean isOnline = false;
    private boolean isConnected = false;

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor();
    private ScheduledFuture<?> heartbeatTask;

    // Driver data (kept in memory)
    private int driverId = -1;
    private String driverName = "";
    private String driverCity = "";
    private Integer stationedAt = null;
    private double[] lastLocation = null;        // [lat, lng]
    private double[] lastSentLocation = null;
    private int[] orderIds = new int[0];

    // ── Service lifecycle ────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        httpClient = new OkHttpClient.Builder()
                .pingInterval(20, TimeUnit.SECONDS)   // TCP-level keep-alive
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(0, TimeUnit.SECONDS)     // no timeout — persistent connection
                .build();
        createNotificationChannel();
        acquireLocks();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification("في انتظار الطلبات..."));

        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        if (action == null) action = "";

        switch (action) {
            case ACTION_GO_ONLINE:
                driverId   = intent.getIntExtra("driver_id", -1);
                driverName = intent.getStringExtra("driver_name") != null ? intent.getStringExtra("driver_name") : "";
                driverCity = intent.getStringExtra("driver_city") != null ? intent.getStringExtra("driver_city") : "";
                // Set initial GPS fix BEFORE connecting so driver_init includes it
                if (intent.hasExtra("initial_lat") && intent.hasExtra("initial_lng")) {
                    lastLocation = new double[]{
                        intent.getDoubleExtra("initial_lat", 0),
                        intent.getDoubleExtra("initial_lng", 0)
                    };
                    lastSentLocation = null; // force a real location_update (not a ping) on first heartbeat
                    Log.d(TAG, "📍 Initial location set: " + lastLocation[0] + ", " + lastLocation[1]);
                }
                isOnline = true;
                connect();
                break;

            case ACTION_GO_OFFLINE:
                isOnline = false;
                stopHeartbeat();
                disconnectClean();
                stopSelf();
                break;

            case ACTION_UPDATE_LOCATION:
                double lat = intent.getDoubleExtra("lat", 0);
                double lng = intent.getDoubleExtra("lng", 0);
                lastLocation = new double[]{lat, lng};
                sendLocationUpdate(false);
                break;

            case ACTION_UPDATE_ORDERS_LIST:
                int[] ids = intent.getIntArrayExtra("order_ids");
                orderIds = ids != null ? ids : new int[0];
                int stationed = intent.getIntExtra("stationed_at", -1);
                stationedAt = stationed == -1 ? null : stationed;
                break;

            case ACTION_SEND_UPDATE_ORDERS:
                int orderId      = intent.getIntExtra("order_id", -1);
                int restaurantId = intent.getIntExtra("restaurant_id", -1);
                sendUpdateOrders(orderId, restaurantId);
                break;

            case ACTION_SEND_FREE_DRIVER:
                sendFreeDriver();
                break;

            case ACTION_CHANGE_CITY:
                String newCity = intent.getStringExtra("city");
                driverCity = newCity != null ? newCity : driverCity;
                sendChangeCity(newCity);
                break;
        }

        // START_STICKY = Android restarts this service automatically if killed
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        stopHeartbeat();
        disconnectClean();
        releaseLocks();
        heartbeatExecutor.shutdownNow();
        super.onDestroy();
    }

    // ── WebSocket Connection ─────────────────────────────────────────────────

    private void connect() {
        if (webSocket != null && isConnected) return;

        Log.d(TAG, "🔌 Connecting WebSocket...");
        Request request = new Request.Builder().url(WS_URL).build();
        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {

            @Override
            public void onOpen(WebSocket ws, Response response) {
                Log.d(TAG, "✅ WS Connected");
                webSocket = ws;
                isConnected = true;
                mainHandler.post(() -> {
                    updateNotification("متصل ✅");
                    sendInitialData();
                    startHeartbeat();
                    broadcastEvent("connected", new JSONObject());
                });
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                Log.d(TAG, "📩 Message: " + text);
                try {
                    JSONObject data = new JSONObject(text);
                    mainHandler.post(() -> {
                        processIncomingMessage(data);
                        broadcastEvent("message", data);
                    });
                } catch (JSONException e) {
                    Log.e(TAG, "Parse error: " + e.getMessage());
                }
            }

            @Override
            public void onClosing(WebSocket ws, int code, String reason) {
                ws.close(1000, null);
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                Log.d(TAG, "❌ WS Closed: " + reason);
                handleDisconnect();
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                Log.e(TAG, "❌ WS Failure: " + t.getMessage());
                handleDisconnect();
            }
        });
    }

    private void handleDisconnect() {
        isConnected = false;
        webSocket = null;
        mainHandler.post(() -> {
            updateNotification("إعادة الاتصال...");
            broadcastEvent("disconnected", new JSONObject());
            if (isOnline) {
                // ✅ Guaranteed reconnect every 3 seconds — runs on real OS thread
                mainHandler.postDelayed(this::connect, RECONNECT_DELAY_MS);
            }
        });
    }

    private void disconnectClean() {
        if (webSocket != null) {
            webSocket.close(1000, "Driver offline");
            webSocket = null;
        }
        isConnected = false;
    }

    // ── Heartbeat ────────────────────────────────────────────────────────────

    private void startHeartbeat() {
        stopHeartbeat();
        heartbeatTask = heartbeatExecutor.scheduleAtFixedRate(() -> {
            if (isOnline && isConnected) {
                mainHandler.post(() -> sendLocationUpdate(false));
            }
        }, HEARTBEAT_INTERVAL_SEC, HEARTBEAT_INTERVAL_SEC, TimeUnit.SECONDS);
    }

    private void stopHeartbeat() {
        if (heartbeatTask != null && !heartbeatTask.isCancelled()) {
            heartbeatTask.cancel(false);
            heartbeatTask = null;
        }
    }

    // ── Send Methods ─────────────────────────────────────────────────────────

    private void sendInitialData() {
        try {
            JSONObject data = new JSONObject();
            data.put("type", "driver_init");
            data.put("driver_id", driverId);
            data.put("driver_name", driverName);
            data.put("driver_type", "driver");
            data.put("driver_city", driverCity);
            data.put("driver_status", "READY");
            data.put("driver_stationed_at", stationedAt != null ? stationedAt : JSONObject.NULL);
            data.put("driver_orders", toJsonArray(orderIds));
            data.put("timestamp", System.currentTimeMillis());
            if (lastLocation != null) {
                JSONObject loc = new JSONObject();
                loc.put("lat", lastLocation[0]);
                loc.put("lng", lastLocation[1]);
                data.put("location", loc);
            }
            sendRaw(data.toString());
        } catch (JSONException e) {
            Log.e(TAG, "sendInitialData error: " + e.getMessage());
        }
    }

    private void sendLocationUpdate(boolean force) {
        if (!isConnected || lastLocation == null) return;

        if (!force && lastSentLocation != null) {
            double dLat = Math.abs(lastLocation[0] - lastSentLocation[0]);
            double dLng = Math.abs(lastLocation[1] - lastSentLocation[1]);
            if (dLat < MOVEMENT_THRESHOLD && dLng < MOVEMENT_THRESHOLD) {
                sendPing();
                return;
            }
        }

        try {
            JSONObject loc = new JSONObject();
            loc.put("lat", lastLocation[0]);
            loc.put("lng", lastLocation[1]);

            JSONObject payload = new JSONObject();
            payload.put("type", "location_update");
            payload.put("driver_id", driverId);
            payload.put("location", loc);
            payload.put("driver_stationed_at", stationedAt != null ? stationedAt : JSONObject.NULL);
            payload.put("driver_orders", toJsonArray(orderIds));
            payload.put("timestamp", System.currentTimeMillis());

            sendRaw(payload.toString());
            lastSentLocation = new double[]{lastLocation[0], lastLocation[1]};
            Log.d(TAG, "📡 Location sent: " + lastLocation[0] + ", " + lastLocation[1]);
        } catch (JSONException e) {
            Log.e(TAG, "sendLocationUpdate error: " + e.getMessage());
        }
    }

    private void sendPing() {
        try {
            JSONObject ping = new JSONObject();
            ping.put("type", "ping");
            ping.put("driver_id", driverId);
            sendRaw(ping.toString());
        } catch (JSONException e) { /* ignore */ }
    }

    private void sendUpdateOrders(int orderId, int restaurantId) {
        try {
            JSONObject data = new JSONObject();
            data.put("type", "update_orders");
            data.put("driver_id", driverId);
            data.put("driver_stationed_at", restaurantId);
            data.put("driver_status", "PICKING_UP");
            data.put("order_id", orderId);
            sendRaw(data.toString());
        } catch (JSONException e) {
            Log.e(TAG, "sendUpdateOrders error: " + e.getMessage());
        }
    }

    private void sendFreeDriver() {
        try {
            JSONObject data = new JSONObject();
            data.put("type", "free_driver");
            data.put("driver_id", driverId);
            data.put("driver_stationed_at", stationedAt != null ? stationedAt : JSONObject.NULL);
            data.put("driver_orders", toJsonArray(orderIds));
            data.put("driver_status", "READY");
            sendRaw(data.toString());
        } catch (JSONException e) {
            Log.e(TAG, "sendFreeDriver error: " + e.getMessage());
        }
    }

    private void sendChangeCity(String city) {
        try {
            JSONObject data = new JSONObject();
            data.put("type", "change_city");
            data.put("driver_id", driverId);
            data.put("driver_city", city);
            sendRaw(data.toString());
        } catch (JSONException e) {
            Log.e(TAG, "sendChangeCity error: " + e.getMessage());
        }
    }

    private void sendRaw(String json) {
        if (webSocket != null && isConnected) {
            webSocket.send(json);
        }
    }

    // ── Broadcast to JS ──────────────────────────────────────────────────────

    /**
     * Sends events back to JavaScript via LocalBroadcast.
     * The DriverTrackerPlugin listens to these and fires Capacitor events.
     */
    private void broadcastEvent(String eventType, JSONObject payload) {
        Intent intent = new Intent(BROADCAST_WS_EVENT);
        intent.putExtra("event_type", eventType);
        intent.putExtra("payload", payload.toString());
        sendBroadcast(intent);
    }

    // ── WakeLock / WifiLock ──────────────────────────────────────────────────

    private void acquireLocks() {
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "DriverApp:WakeLock");
                wakeLock.acquire(12 * 60 * 60 * 1000L /* 12 hours max */);
            }
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
            if (wm != null) {
                wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "DriverApp:WifiLock");
                wifiLock.acquire();
            }
        } catch (Exception e) {
            Log.w(TAG, "acquireLocks: " + e.getMessage());
        }
    }

    private void releaseLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            if (wifiLock != null && wifiLock.isHeld()) wifiLock.release();
        } catch (Exception e) {
            Log.w(TAG, "releaseLocks: " + e.getMessage());
        }
    }

    // ── Notification ─────────────────────────────────────────────────────────

    private void createNotificationChannel() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        // 1. Sticky foreground service channel (Low importance)
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Driver Tracking",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Keeps driver WebSocket alive");
        nm.createNotificationChannel(channel);

        // 2. High-priority Alert channel (High importance + Sound)
        NotificationChannel alertChannel = new NotificationChannel(
                ALERT_CHANNEL_ID,
                "Order Alerts",
                NotificationManager.IMPORTANCE_HIGH
        );
        alertChannel.setDescription("New order assignments and ready status alerts");
        alertChannel.enableLights(true);
        alertChannel.enableVibration(true);
        alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        // Custom Sound: android.resource://[package]/raw/order_sound
        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/order_sound");
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
        alertChannel.setSound(soundUri, audioAttributes);

        nm.createNotificationChannel(alertChannel);
    }

    private Notification buildNotification(String status) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Delivery Shop - سائق")
                .setContentText(status)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .setSilent(true)
                .build();
    }

    private void updateNotification(String status) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification(status));
    }

    private void processIncomingMessage(JSONObject data) {
        try {
            String type = data.optString("type", "");
            if ("new_order_nearby".equals(type)) {
                JSONObject order = data.optJSONObject("order");
                if (order != null) {
                    int orderId = order.optInt("order_id", -1);
                    if (isOrderTracked(orderId)) {
                        Log.d(TAG, "Skipping notification for already tracked order: " + orderId);
                        return;
                    }
                    String restName = order.optString("restaurant_name", "مطعم جديد");
                    showOrderAlert("طلب جديد قريب منك 📦", "لديك طلب جديد من " + restName);
                }
            }
            else if ("new_orders_nearby".equals(type)) {
                JSONArray orders = data.optJSONArray("orders");
                if (orders != null && orders.length() > 0) {
                    boolean hasNew = false;
                    for (int i = 0; i < orders.length(); i++) {
                        JSONObject o = orders.optJSONObject(i);
                        if (o != null && !isOrderTracked(o.optInt("order_id", -1))) {
                            hasNew = true;
                            break;
                        }
                    }
                    if (hasNew) {
                        showOrderAlert("طلبات جديدة قريبة منك 📦", "لديك " + orders.length() + " طلبات جديدة جاهزة للاستلام");
                    } else {
                        Log.d(TAG, "Skipping notification: all orders already tracked");
                    }
                }
            }
            else if ("order_status_updated".equals(type)) {
                String status = data.optString("order_status", "");
                if ("ready".equalsIgnoreCase(status)) {
                    int orderId = data.optInt("order_id", 0);
                    showOrderAlert("طلب جاهز للاستلام ✅", "الطلب رقم #" + orderId + " جاهز الآن");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "processIncomingMessage error: " + e.getMessage());
        }
    }

    private boolean isOrderTracked(int orderId) {
        if (orderIds == null) return false;
        for (int id : orderIds) {
            if (id == orderId) return true;
        }
        return false;
    }

    private void showOrderAlert(String title, String message) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, (int)System.currentTimeMillis(), launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/order_sound");

        Notification notification = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 500, 200, 500})
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, true) // Heads-up notification
                .build();

        nm.notify(ALERT_NOTIFICATION_ID, notification);
    }

    private JSONArray toJsonArray(int[] ids) {
        JSONArray arr = new JSONArray();
        if (ids != null) for (int id : ids) arr.put(id);
        return arr;
    }
}
