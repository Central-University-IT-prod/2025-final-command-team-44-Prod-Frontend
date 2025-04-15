export interface WebSocketResponse {
	event: "booking_canceled" | "booking_updated" | "booking_created" | "booking_started";
	table_id: string;
	time_start: string;
	time_end: string;
}