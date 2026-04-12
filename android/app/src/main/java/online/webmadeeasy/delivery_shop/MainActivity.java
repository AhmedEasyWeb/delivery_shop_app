package online.webmadeeasy.delivery_shop;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import online.webmadeeasy.delivery_shop.DriverPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DriverPlugin.class);
        super.onCreate(savedInstanceState);
    }
}