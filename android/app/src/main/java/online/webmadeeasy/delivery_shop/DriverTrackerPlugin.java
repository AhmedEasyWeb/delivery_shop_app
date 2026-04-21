package online.webmadeeasy.delivery_shop;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * DriverTrackerPlugin
 *
 * This is the Capacitor bridge between JavaScript (useDriverTraker.ts) and the
 * native DriverWebSocketService.
 *
 * JS → Java:  calls like goOnline(), goOffline(), updateLocation() etc.
 * Java → JS:  events like "wsConnected", "wsDisconnected", "wsMessage"
 *             fired back to the Vue composable via notifyListeners().
 */
@CapacitorPlugin(name = "DriverTracker")
public class DriverTrackerPlugin extends Plugin {

    private static final String TAG = "DriverTrackerPlugin";

    private BroadcastReceiver wsEventReceiver;

    // ── Plugin lifecycle ──────────────────────────────────────────────────────

    @Override
    public void load() {
        super.load();
        registerBroadcastReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        unregisterBroadcastReceiver();
        super.handleOnDestroy();
    }

    // ── JS → Java methods ─────────────────────────────────────────────────────

    /**
     * Called from JS: DriverTrackerPlugin.goOnline({ driver_id, driver_name, driver_city })
     * Starts DriverWebSocketService with the driver info.
     */
    @PluginMethod
    public void goOnline(PluginCall call) {
        int driverId      = call.getInt("driver_id", -1);
        String driverName = call.getString("driver_name", "");
        String driverCity = call.getString("driver_city", "");
        // Initial GPS position grabbed by JS before this call — may be null
        Double initialLat = call.hasOption("initial_lat") && !call.getData().isNull("initial_lat")
                ? call.getDouble("initial_lat") : null;
        Double initialLng = call.hasOption("initial_lng") && !call.getData().isNull("initial_lng")
                ? call.getDouble("initial_lng") : null;

        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_GO_ONLINE);
        intent.putExtra("driver_id",   driverId);
        intent.putExtra("driver_name", driverName);
        intent.putExtra("driver_city", driverCity);
        if (initialLat != null && initialLng != null) {
            intent.putExtra("initial_lat", (double) initialLat);
            intent.putExtra("initial_lng", (double) initialLng);
        }

        getContext().startForegroundService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.goOffline()
     * Stops the service and closes the connection.
     */
    @PluginMethod
    public void goOffline(PluginCall call) {
        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_GO_OFFLINE);
        getContext().startService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.updateLocation({ lat, lng })
     * Passes new GPS coordinates to the service for transmission.
     */
    @PluginMethod
    public void updateLocation(PluginCall call) {
        double lat = call.getDouble("lat", 0.0);
        double lng = call.getDouble("lng", 0.0);

        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_UPDATE_LOCATION);
        intent.putExtra("lat", lat);
        intent.putExtra("lng", lng);
        getContext().startService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.updateOrdersList({ order_ids: int[], stationed_at: int })
     * Keeps Java in sync with the current orders state from Pinia.
     */
    @PluginMethod
    public void updateOrdersList(PluginCall call) {
        JSArray jsIds    = call.getArray("order_ids");
        int stationedAt  = call.getInt("stationed_at", -1);

        int[] ids = new int[0];
        if (jsIds != null) {
            try {
                JSONArray arr = jsIds.toJSONArray();
                ids = new int[arr.length()];
                for (int i = 0; i < arr.length(); i++) {
                    ids[i] = arr.getInt(i);
                }
            } catch (JSONException e) {
                Log.e(TAG, "updateOrdersList parse error: " + e.getMessage());
            }
        }

        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_UPDATE_ORDERS_LIST);
        intent.putExtra("order_ids",   ids);
        intent.putExtra("stationed_at", stationedAt);
        getContext().startService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.sendUpdateOrders({ order_id, restaurant_id })
     */
    @PluginMethod
    public void sendUpdateOrders(PluginCall call) {
        int orderId      = call.getInt("order_id", -1);
        int restaurantId = call.getInt("restaurant_id", -1);

        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_SEND_UPDATE_ORDERS);
        intent.putExtra("order_id",      orderId);
        intent.putExtra("restaurant_id", restaurantId);
        getContext().startService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.sendFreeDriver()
     */
    @PluginMethod
    public void sendFreeDriver(PluginCall call) {
        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_SEND_FREE_DRIVER);
        getContext().startService(intent);
        call.resolve();
    }

    /**
     * Called from JS: DriverTrackerPlugin.changeCity({ city: string })
     */
    @PluginMethod
    public void changeCity(PluginCall call) {
        String city = call.getString("city", "");

        Intent intent = new Intent(getContext(), DriverWebSocketService.class);
        intent.setAction(DriverWebSocketService.ACTION_CHANGE_CITY);
        intent.putExtra("city", city);
        getContext().startService(intent);
        call.resolve();
    }

    // ── Java → JS broadcast receiver ─────────────────────────────────────────

    /**
     * Receives broadcasts from DriverWebSocketService and forwards them
     * to JavaScript as Capacitor events.
     *
     * JS subscribes with:
     *   DriverTrackerPlugin.addListener('wsConnected',    cb)
     *   DriverTrackerPlugin.addListener('wsDisconnected', cb)
     *   DriverTrackerPlugin.addListener('wsMessage',      cb)
     */
    private void registerBroadcastReceiver() {
        wsEventReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String eventType = intent.getStringExtra("event_type");
                String payloadStr = intent.getStringExtra("payload");

                if (eventType == null) return;

                JSObject jsPayload = new JSObject();
                try {
                    if (payloadStr != null && !payloadStr.isEmpty()) {
                        JSONObject json = new JSONObject(payloadStr);
                        // Copy all keys from JSON to JSObject
                        JSONArray keys = json.names();
                        if (keys != null) {
                            for (int i = 0; i < keys.length(); i++) {
                                String key = keys.getString(i);
                                jsPayload.put(key, json.get(key));
                            }
                        }
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "BroadcastReceiver parse error: " + e.getMessage());
                }

                switch (eventType) {
                    case "connected":
                        notifyListeners("wsConnected", jsPayload);
                        break;
                    case "disconnected":
                        notifyListeners("wsDisconnected", jsPayload);
                        break;
                    case "message":
                        notifyListeners("wsMessage", jsPayload);
                        break;
                }
            }
        };

        IntentFilter filter = new IntentFilter(DriverWebSocketService.BROADCAST_WS_EVENT);
        getContext().registerReceiver(wsEventReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    private void unregisterBroadcastReceiver() {
        if (wsEventReceiver != null) {
            try {
                getContext().unregisterReceiver(wsEventReceiver);
            } catch (Exception e) {
                Log.w(TAG, "unregisterReceiver: " + e.getMessage());
            }
            wsEventReceiver = null;
        }
    }
}
