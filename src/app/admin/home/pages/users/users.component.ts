import { Component, ElementRef, signal, ViewChild, WritableSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { BookingAdminResponse, LocationResponse, UserBookingForAdmin } from "../../../../../generated";
import { DataService } from "../../../../core/services/data.service";
import { NotificationsService } from "../../../../core/services/notifications.service";
import { BookingCard } from "../../interfaces/booking-card";
import { NavbarService } from "../../services/navbar.service";

@Component({
	selector: "app-users",
	imports: [RouterLink, FormsModule],
	templateUrl: "./users.component.html",
	styleUrl: "./users.component.css",
})
export default class UsersComponent {

	constructor(
		public navService: NavbarService,
		private dataService: DataService,
		private route: ActivatedRoute,
		private notificationService: NotificationsService,
	) {
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, "0");
		var mm = String(today.getMonth() + 1).padStart(2, "0");
		this.date_today = dd + "." + mm;
		console.log(this.date_today);
		this.setUpLocation();
		dataService.getBookingsByLocation(navService.locationId() as string).then((val) => {
			console.log(val);
			this.usersList.set(this.parse(val));
			this.sortUsers();
			console.log(this.usersList());
			this.setupInitialForm();

		}).catch(e => {
			this.notificationService.addNotification({
				type: "error",
				message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
				timeOut: 5000,
			});
		});

	}

	findCreator(users: UserBookingForAdmin[]) {
		return users.find(el => {
			return el.status === "creator";
		});
	}

	parse(res: BookingAdminResponse[]): BookingCard[] {
		let toReturn: BookingCard[] = [];
		res.forEach(el => {
			let creator = this.findCreator(el.users);
			toReturn.push({
				name: creator?.first_name ? creator?.first_name : "",
				telegram_username: creator?.username ? creator?.username : "",
				time_start: el.time_start.slice(11, 16),
				time_end: el.time_end.slice(11, 16),
				date_start: el.time_start.split("T")[0].split("-")[2] + "." + el.time_start.split("T")[0].split("-")[1],
				date_end: el.time_end.split("T")[0].split("-")[2] + "." + el.time_end.split("T")[0].split("-")[1],
				booking_id: el.id,
				code: el.code,
				features: el.features,
				comment: el.comment,
				amount: el.people_amount,
				members: el.users,
				table_id: el.table_id,
			});
		});
		return toReturn;
	}


	public location: LocationResponse | null = null;

	setUpLocation() {
		const id = this.route.snapshot.paramMap.get("id");
		this.navService.locationId.set(id);
	}

	@ViewChild("inner") inner !: ElementRef;

	filterName: string = "";

	filterStart: string = "";

	filterEnd: string = "";

	date_today: string = "";

	usersList: WritableSignal<BookingCard[]> = signal<BookingCard[]>([]);

	filter = signal<{ name: string, start: number, end: number }>({
		name: "",
		start: 0,
		end: 0,
	});

	openedCardId = signal<string>("");

	filterCard(card: BookingCard) {
		return ( ( card.name.toLowerCase().indexOf(this.filterName.toLowerCase()) == 0 )
				|| ( this.filterName.length > 1
					&& this.filterName[0] == "@"
					&& card.telegram_username.toLowerCase().indexOf(this.filterName.slice(1).toLowerCase()) == 0 )
				|| ( this.filterName.length == 1
					&& this.filterName[0] == "@" ) )
			&& ( Date.parse(this.toInputDate(card.date_start, card.time_start)) >=
				Date.parse(this.filterStart) )
			&& ( Date.parse(this.toInputDate(card.date_end, card.time_end)) <=
				Date.parse(this.filterEnd) );

	}

	toInputDate(date: string, time: string): string {
		return "2025-" + date.slice(3, 5)
			+ "-" + date.slice(0, 2)
			+ "T" + time.slice(0, 2)
			+ ":" + time.slice(3, 5);
	}


	toNormalDate(date: string, time: string): number {
		let res: string = this.toInputDate(date, time);
		return Date.parse(res);
	}


	sortUsers() {
		this.usersList.update(val => {
			return val.sort((a: BookingCard, b: BookingCard) => {
				let da: number = this.toNormalDate(a.date_start, a.time_start);
				let db: number = this.toNormalDate(b.date_start, b.time_start);

				let da2: number = this.toNormalDate(a.date_end, a.time_end);
				let db2: number = this.toNormalDate(b.date_end, b.time_end);
				if (da < db)
					return -1;
				else if (da === db) {
					if (da2 < db2) {
						return -1;
					}
					else {
						return 1;
					}
				}
				else return 1;
			});
		});
	}


	setupInitialForm() {
		this.filterName = "";

		let maxDate: number | null = null;
		let minDate: number | null = null;
		this.usersList().forEach(el => {

			let dStart = this.toInputDate(
				el.date_start,
				el.time_start,
			);

			let dEnd = this.toInputDate(
				el.date_end,
				el.time_end,
			);

			let curS = Date.parse(dStart);
			let curE = Date.parse(dEnd);
			console.log(curE);
			if (!maxDate || maxDate < curE) {
				maxDate = curE;
				this.filterEnd = dEnd;
			}

			if (!minDate || minDate > curS) {
				minDate = curS;
				this.filterStart = dStart;
			}
		});
	}

	missClick(ev: Event) {
		console.log(ev.target);
		//@ts-ignore
		if (ev.target == this.inner.nativeElement || ev.target.classList.contains("timemark")) {
			this.openedCardId.set("");
		}
	}


	removeBooking(bookingIdx: number, bookingId: string) {
		this.openedCardId.set("");

		document.getElementsByClassName("opened")[0].classList.remove("opened");

		this.dataService.removeTableBooking(
			this.navService.locationId() as string,
			this.usersList()[bookingIdx].table_id,
			bookingId).then(val => {
			this.notificationService.addNotification({
				type: "info",
				message: "Бронирование отменено",
				timeOut: 5000,
			});
		}).catch(e => {
			this.notificationService.addNotification({
				type: "error",
				message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
				timeOut: 5000,
			});
		});
		setTimeout(() => {
			this.usersList.update(val => {
				val.splice(bookingIdx, 1);
				return val;
			});
			console.log(this.openedCardId());
		}, 500);
	}
}
