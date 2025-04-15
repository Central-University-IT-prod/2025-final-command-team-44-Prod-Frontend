import { UserBookingForAdmin } from "../../../../generated";

export interface BookingCard {
	name: string,
	time_start: string,
	time_end: string,
	code: string,
	telegram_username: string,
	booking_id: string,
	table_id: string,
	date_start: string,
	date_end: string,
	features: string[],
	comment: string,
	amount: number,
	members: UserBookingForAdmin[]
}
