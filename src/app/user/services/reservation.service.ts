import { effect, Injectable, signal } from "@angular/core";
import { firstValueFrom, Subscription } from "rxjs";
import { webSocket } from "rxjs/webSocket";
import { environment } from "../../../environments/environment";
import { JwtService } from "../../auth/services/jwt";
import { UserService } from "../../auth/services/user.service";
import { ApiService } from "../../core/services/api.service";
import { UserDataService } from "../../core/services/user-data.service";
import { TimeIntervalModel } from "../models/time-slot.model";
import { WebSocketResponse } from "../models/websocket-response.model";

@Injectable({
	providedIn: "root",
})
export class ReservationService {

	public isPopupClosed = signal<boolean>(true);

	public reservedTables = signal<string[]>([]);

	public reservationTime: TimeIntervalModel | null = null;

	public reservingTable = signal<string | null>(null);

	public locationId = signal<string>("");

	private socketSubscription: Subscription | null = null;

	constructor(
		private jwt: JwtService,
		private userService: UserService,
		private dataService: UserDataService,
		private api: ApiService,
	) {
		effect(() => {
			const locationId = this.locationId();
			if (locationId !== "")
				this.connectSockets();
		});
	}

	removeSockets() {
		if (this.socketSubscription !== null)
			this.socketSubscription.unsubscribe();
	}

	connectSockets() {
		this.removeSockets();

		const token = this.jwt.getToken();
		const subject = webSocket(`${ environment.socketUrl }/users/booking/ws/${ this.locationId() }?token=${ token }`);

		this.socketSubscription = subject.subscribe(
			(msg) => {
				const resp = msg as WebSocketResponse;
				if (resp.event === "booking_canceled")
					this.reservedTables.update(tables => {
						let res = [];
						for (const table of tables) {
							if (resp.table_id != table)
								res.push(table);
						}
						return res;
					});
				else if (resp.event === "booking_created") {
					const start = this.convertIntervalToISOTime().split('T').join(' ').split(':')[0];
					const end = this.convertIntervalToISOTime(true).split('T').join(' ').split(':')[0];
					const start_event = resp.time_start.split(':')[0];
					const end_event = resp.time_end.split(':')[0];

					const valid = start <= end_event && end >= start_event;
					if (valid) {
						this.reservedTables.update(tables => [...tables, resp.table_id]);
					}
				}
			},
			err => {
				setTimeout(() => {
					this.connectSockets();
				}, 5000);
			},
			() => console.log("complete"),
		);
	}

	checkTableAvailability(id: string) {
		const reservedTables = this.reservedTables();
		for (const reservedTable of reservedTables)
			if (reservedTable === id)
				return false;
		return true;
	};

	convertIntervalToISOTime(addDuration: boolean = false): string {
		const start = new Date();
		const [day, month] = this.reservationTime?.start.date.split(".")!;
		const [hours, minutes] = this.reservationTime?.start.time.split(":")!;
		start.setMonth(Number(month) - 1);
		start.setDate(Number(day));
		if (addDuration)
			start.setHours(Number(hours) + Number(this.reservationTime?.hoursCount) + 3);
		else
			start.setHours(Number(hours) + 3);
		start.setMinutes(0);
		start.setSeconds(0);
		return start.toISOString();
	}

	async getReservedSeats(): Promise<void> {
		let reserved = [];
		try {
			reserved = await firstValueFrom(this.api.apiService.getLocationBookings(this.locationId(), {
					time_start: this.convertIntervalToISOTime(),
					hours: this.reservationTime?.hoursCount,
				},
			));
		} catch (error) {
			console.log(error);
		}
		this.reservedTables.set(reserved);
	}

	openReservationMenu(id: string, interval: TimeIntervalModel) {
		this.reservationTime = interval;
		this.reservingTable.set(id);
	}

	async makeReservation(tableId: string, preferences: string[], preferenceString: string, peopleCount: number = 1) {
		return this.dataService.createBooking(this.locationId(), tableId, {
			people_amount: peopleCount,
			comment: preferenceString,
			features: preferences,
			hours: this.reservationTime?.hoursCount,
			time_start: this.convertIntervalToISOTime(),
		});
	}
}
