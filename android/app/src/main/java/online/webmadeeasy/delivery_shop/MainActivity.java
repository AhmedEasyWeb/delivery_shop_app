package online.webmadeeasy.delivery_shop;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Register our native plugin BEFORE super.onCreate so Capacitor sees it
        registerPlugin(DriverTrackerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
