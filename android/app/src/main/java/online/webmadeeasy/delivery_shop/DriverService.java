package online.webmadeeasy.delivery_shop;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class DriverService extends Service {
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private WebSocket webSocket;
    private OkHttpClient client;
    private String driverId;
    private String driverName, driverCity;
    private String driverOrders = "[]";
    private Integer driverStationedAt;
    private static final String CHANNEL_ID = "DriverServiceChannel";

    private final BroadcastReceiver updateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.hasExtra("driver_orders")) {
                driverOrders = intent.getStringExtra("driver_orders");
            }

            if (intent.hasExtra("driver_city")) {
                driverCity = intent.getStringExtra("driver_city");
                
                if (webSocket != null) {
                    String cityJson = "{\"type\":\"city_update\",\"driver_id\":\"" + driverId + "\",\"city\":\"" + driverCity + "\"}";
                    webSocket.send(cityJson);
                }            
            }

            if (intent.hasExtra("driver_stationed_at")) {
                driverStationedAt = intent.getIntExtra("driver_stationed_at", -1);
            }
            
            Log.d("DriverService", "Native data updated via Broadcast");
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        client = new OkHttpClient();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        setupLocationCallback();
        IntentFilter filter = new IntentFilter("com.delivery.UPDATE_DRIVER_DATA");
        registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            driverId = intent.getStringExtra("driver_id");
            driverName = intent.getStringExtra("driver_name");
            driverCity = intent.getStringExtra("driver_city");
            driverOrders = intent.getStringExtra("driver_orders");
            driverStationedAt = intent.getIntExtra("driver_stationed_at", -1);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Delivery Shop")
                .setContentText("تتبع الموقع نشط الآن...")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true) 
                .build();

        startForeground(1, notification);

        startWebSocket();
        startLocationUpdates();
        
        return START_STICKY;
    }

    private void createNotificationChannel() {
        NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Driver Background Channel",
                NotificationManager.IMPORTANCE_LOW 
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(serviceChannel);
        }
    }

    private void setupLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null || webSocket == null || driverId == null) return;

                for (Location location : locationResult.getLocations()) {
                    String locJson = "{" +
                        "\"type\":\"location_update\"," +
                        "\"driver_id\":\"" + driverId + "\"," +
                        "\"location\":{\"lat\":" + location.getLatitude() + ",\"lng\":" + location.getLongitude() + "}," +
                        "\"driver_stationed_at\":" + ((driverStationedAt == -1) ? "null" : driverStationedAt) + "," +
                        "\"driver_orders\":" + driverOrders + "," +
                        "\"timestamp\":" + System.currentTimeMillis() +
                    "}";
                    webSocket.send(locJson);
                    Log.d("DriverService", "Location Sent: " + location.getLatitude());
                }
            }
        };
    }

    private void startLocationUpdates() {
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 30000)
                .setMinUpdateIntervalMillis(15000)
                .build();

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest,
                    locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            Log.e("DriverService", "Location permission missing!");
        }
    }

    private void startWebSocket() {
        Request request = new Request.Builder()
                .url("wss://deliveryshop.cloud")
                .build();

        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                String stationedValue = (driverStationedAt == -1) ? "null" : driverStationedAt.toString();
        
                String initJson = "{" +
                    "\"type\":\"driver_init\"," +
                    "\"driver_id\":\"" + driverId + "\"," +
                    "\"driver_name\":\"" + driverName + "\"," +
                    "\"driver_type\":\"driver\"," +
                    "\"driver_city\":\"" + driverCity + "\"," +
                    "\"driver_status\":\"READY\"," +
                    "\"driver_stationed_at\":" + stationedValue + "," +
                    "\"driver_orders\":" + driverOrders + "" +
                "}";
                
                webSocket.send(initJson);
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                Log.d("DriverService", "Received: " + text);
                
                // 1. Show native notifications for background alerts
                if (text.contains("new_order_nearby")) {
                    sendOrderNotification("📦 طلب جديد قريب منك", "تفقد التطبيق لرؤية تفاصيل الطلب");
                }
                if (text.contains("order_status_updated") && text.contains("ready")) {
                    sendOrderNotification("✅ الطلب جاهز", "الطلب الآن جاهز للاستلام من المطعم");
                }

                // 2. BROADCAST to the Plugin so Vue UI updates
                Intent intent = new Intent("com.delivery.SWIFT_UI_UPDATE");
                intent.putExtra("payload", text);
                sendBroadcast(intent);
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                reconnect();
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, @Nullable Response response) {
                reconnect();
            }
        });
    }

    private void reconnect() {
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (driverId != null) {
                startWebSocket();
            }
        }, 5000);
    }

    private void sendOrderNotification(String title, String message) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        int notificationId = (int) System.currentTimeMillis();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_chat)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(new long[] { 0, 500, 200, 500 })
                .setDefaults(Notification.DEFAULT_SOUND);

        notificationManager.notify(notificationId, builder.build());
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        fusedLocationClient.removeLocationUpdates(locationCallback);
        if (webSocket != null) webSocket.close(1000, "Service Destroyed");
        driverId = null; 
        unregisterReceiver(updateReceiver);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}