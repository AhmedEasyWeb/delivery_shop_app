export interface Order {
  order_id: number;
  order_total_price: number;
  order_delivery_cost: number;
  order_status: string;
  order_receipt: string;
  order_notes: string;
  order_city: string;
  driver_id?: number | null;
  restaurant_id: number;
  created_at: string;
  ready_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  user_name: string;
  user_phone: string;
  user_address: string;
  sum_of_orders?: number;
  total_price?: number;
  delivery_cost?: number;
  sum_of_completed_orders?: number;
  payment_method?: string;
  cancelation_reason?: string | null;
}
