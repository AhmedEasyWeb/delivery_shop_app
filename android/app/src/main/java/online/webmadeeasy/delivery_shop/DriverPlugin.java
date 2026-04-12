package online.webmadeeasy.delivery_shop;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DriverTracker")
public class DriverPlugin extends Plugin {
    private BroadcastReceiver uiReceiver;

    @Override
    public void load() {
        uiReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getAction().equals("com.delivery.SWIFT_UI_UPDATE")) {
                    String payload = intent.getStringExtra("payload");
                    JSObject ret = new JSObject();
                    ret.put("data", payload);
                    
                    // Emits the event to the Vue listener
                    notifyListeners("onWebsocketMessage", ret);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.delivery.SWIFT_UI_UPDATE");
        // Use RECEIVER_NOT_EXPORTED for security on Android 14+
        getContext().registerReceiver(uiReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    @PluginMethod
    public void startService(PluginCall call) {
        String driverId = call.getString("driver_id");
        String driverName = call.getString("driver_name");
        String driverCity = call.getString("driver_city");
        Integer stationedAt = call.getInt("driver_stationed_at"); 
        
        // Convert JS Array to String for Intent transfer
        String driverOrders = "[]";
        if (call.hasOption("driver_orders")) {
            driverOrders = call.getArray("driver_orders").toString();
        }

        Intent intent = new Intent(getContext(), DriverService.class);
        intent.putExtra("driver_id", driverId);
        intent.putExtra("driver_name", driverName);
        intent.putExtra("driver_city", driverCity);
        intent.putExtra("driver_stationed_at", stationedAt != null ? stationedAt : -1);
        intent.putExtra("driver_orders", driverOrders);

        getContext().startForegroundService(intent);
        call.resolve();    
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), DriverService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void updateDriverData(PluginCall call) {
        // This broadcasts TO the DriverService
        Intent intent = new Intent("com.delivery.UPDATE_DRIVER_DATA");
        
        if (call.hasOption("driver_orders")) {
            intent.putExtra("driver_orders", call.getArray("driver_orders").toString());
        }
        
        if (call.hasOption("driver_stationed_at")) {
            intent.putExtra("driver_stationed_at", call.getInt("driver_stationed_at", -1));
        }

        if (call.hasOption("driver_status")) {
            intent.putExtra("driver_status", call.getString("driver_status"));
        }

        if (call.hasOption("driver_city")) {
            intent.putExtra("driver_city", call.getString("driver_city"));
        }

        getContext().sendBroadcast(intent);
        call.resolve();
    }

    // Clean up to prevent memory leaks
    @Override
    protected void handleOnDestroy() {
        if (uiReceiver != null) {
            getContext().unregisterReceiver(uiReceiver);
        }
        super.handleOnDestroy();
    }
}