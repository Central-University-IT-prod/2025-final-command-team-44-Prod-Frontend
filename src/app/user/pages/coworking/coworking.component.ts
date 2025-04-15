import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	model,
	OnDestroy,
	signal,
	ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner, MatSpinner } from "@angular/material/progress-spinner";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "../../../auth/services/user.service";
import { ApiService } from "../../../core/services/api.service";
import { NotificationsService } from "../../../core/services/notifications.service";
import { UserDataService } from "../../../core/services/user-data.service";
import { addMonthNameToDateString, convertDateToHoursString, convertDateToString } from "../../../core/utils";
import { TimeIntervalModel } from "../../models/time-slot.model";
import { CoworkingMediaService } from "../../services/coworking-media.service";
import { ReservationService } from "../../services/reservation.service";

@Component({
	selector: "app-coworking",
	imports: [
		MatSpinner,
		FormsModule,
		MatIcon,
		MatProgressSpinner,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: "./coworking.component.html",
	styleUrl: "./coworking.component.css",
})
export default class CoworkingComponent implements OnDestroy {
	@ViewChild("imageElement") imageElement!: ElementRef<HTMLDivElement>;
	@ViewChild("imageContainer") imageContainer!: ElementRef<HTMLDivElement>;

	reservationDate = model<string>("");
	reservationTime = model<string>("");
	reservationDuration = model<number>(1);

	availableDates: string[] = [];
	availableTimes: string[] = [];
	availableDuration: number[] = [];

	freePlaces = signal<boolean>(true);

	private _width = 100;
	protected get width() { return `${ this._width }%`; }

	protected height: string | undefined;
	protected svg = signal<SafeHtml | undefined>(undefined);

	public media: CoworkingMediaService;

	validSvg = computed(() => this.media.validSvg());

	gettingInterval = signal<number>(0);

	blockFastRenting = signal<boolean>(false);

	constructor(
		private sanitizer: DomSanitizer,
		private reservation: ReservationService,
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private userService: UserService,
		private dataService: UserDataService,
		private notificationService: NotificationsService,
	) {
		/** adding listener to change available time slots */
		effect(() => {
			const date = this.reservationDate();
			if (date !== "") this.setUpTimeSlots();
		});
		/** adding listener to change svg and its styles */
		effect(() => {
			const interval: TimeIntervalModel = {
				start: { date: this.reservationDate(), time: this.reservationTime() },
				hoursCount: this.reservationDuration(),
			};
			this.gettingInterval.set(1);
			if (this.checkInterval(interval)) {
				this.reservation.reservationTime = interval;
				this.reservation.getReservedSeats();
			}
		});
		/** effect for svg change */
		effect(() => {
			const svg = this.media.svg();
			if (svg !== null) {
				this.svg.set(svg);
				setTimeout(() => this.setStyles(), 10);
			}
			else {
				this.gettingInterval.set(0);
			}
		});

		/** setting default values */
		this.setUpDateSlots();
		/** setting svg service */
		const id = this.route.snapshot.paramMap.get("id");
		this.media = new CoworkingMediaService(this.sanitizer, this.api, this.reservation, this.router, this.userService, id);
		if (id === null) {
			this.router.navigate(["/user"]);
			return;
		}
		this.reservation.locationId.set(id);
	}

	ngOnDestroy() {
	}

	/** Checks time interval for being correct */
	checkInterval(interval: TimeIntervalModel | null): boolean {
		if (interval === null) return false;
		if (interval.hoursCount <= 0 || interval.hoursCount > 24) return false;
		const day = convertDateToString(new Date());
		const time = convertDateToHoursString(new Date());
		if (day > interval.start.date) return false;
		if (day === interval.start.date && time > interval.start.time) return false;
		return true;
	}

	/** sets available dates */
	setUpDateSlots() {
		const today = new Date();

		this.availableDuration = [];
		for (let i = 1; i <= 12; i++) {
			this.availableDuration.push(i);
		}

		for (let i = 0; i < 7; i++) {
			const day = new Date(today);
			day.setDate(today.getDate() + i);
			this.availableDates.push(convertDateToString(day));
		}

		this.reservationDate.set(this.availableDates[0]);
	}

	/** sets available times depending on chosen date */
	setUpTimeSlots() {
		const today = convertDateToString(new Date());
		const todayTime = convertDateToHoursString(new Date());
		let startDate = this.reservationDate();

		this.availableTimes = [];
		for (let hours = 0; hours < 24; hours++) {
			let time = `${ String(hours).padStart(2, "0") }:00`;
			if (( startDate === today && time > todayTime ) || startDate !== today)
				this.availableTimes.push(time);
		}

		if (this.availableTimes.length === 0) {
			this.availableTimes.push("23:00");
		}

		this.reservationTime.set(this.availableTimes[0]);
	}

	/** sets svg styles */
	setStyles() {
		const svg = this.imageElement.nativeElement.getElementsByTagName("svg").item(0);
		this.freePlaces.set(false);
		if (svg) {
			const group = svg.getElementsByTagName("g").item(0)!;
			for (let i = 0; i < group.children.length; i++) {
				const child = group.children[i];
				if (child.id.includes("table")) {
					const rect = child.getElementsByTagName("rect").item(0);
					let tableId = "";
					if (rect === null || !rect.id.includes('table')) tableId = child.id;
					else tableId = rect.id;
					// coloring not available tables
					if (!this.reservation.checkTableAvailability(tableId)) {
						child.classList.add(this.media.svgNotAvailableTableStyle);
						continue;
					}

					//@ts-ignore
					child.onclick = (ev: MouseEvent) => { this.tableClickHandler(ev, tableId); };

					this.freePlaces.set(true);
				}

				if (child.id.includes("room")) {
					let roomId = child.id;
					// coloring not available rooms
					if (!this.reservation.checkTableAvailability(roomId)) {
						child.classList.add(this.media.svgNotAvailableTableStyle);
						continue;
					}

					//@ts-ignore
					child.onclick = (ev: MouseEvent) => { this.tableClickHandler(ev, roomId); };

					this.freePlaces.set(true);
				}
			}
		}

		this.gettingInterval.set(0);
	}

	/** click handler on each table -> makes it reservation */
	tableClickHandler(ev: MouseEvent, id: string) {
		const interval: TimeIntervalModel = {
			start: { date: this.reservationDate(), time: this.reservationTime() },
			hoursCount: this.reservationDuration(),
		};
		if (!this.reservation.checkTableAvailability(id) && this.checkInterval(interval)) return;
		this.reservation.openReservationMenu(id, interval);
	}

	/** Zooms out svg */
	zoomOut() {
		if (this._width / 1.2 >= 50)
			this._width = this._width / 1.2;
	}

	/** Zooms in svg */
	zoomIn() {
		console.log(this._width);
		if (this._width * 1.2 <= 1000)
			this._width = this._width * 1.2;
	}

	imageTouchStartHandler(event: MouseEvent) {
		let [x, y] = [event.clientX, event.clientY];
		const container = this.imageContainer.nativeElement;
		const element = this.imageElement.nativeElement;

		const mouseMove = (event: MouseEvent) => {
			let [dx, dy] = [event.clientX - x, event.clientY - y];
			let [sx, sy] = [container.scrollLeft - dx, container.scrollTop - dy];
			[sx, sy] = [Math.max(0, sx), Math.max(0, sy)];
			container.scrollTo({
				left: sx,
				top: sy,
			});
		};
		const mouseEnd = (event: MouseEvent) => {
			element.removeEventListener("mousemove", mouseMove);
			element.removeEventListener("mouseup", mouseEnd);
		};

		element.addEventListener("mousemove", mouseMove);
		element.addEventListener("mouseup", mouseEnd);
	}

	joinQueue() {
		if (this.blockFastRenting()) return
		this.blockFastRenting.set(true);

		const date = new Date();
		const [day, month] = this.reservationDate().split(".");
		const [h, _] = this.reservationTime().split(":");
		date.setMonth(Number(month) - 1);
		date.setDate(Number(day));
		date.setHours(Number(h) + 3);
		date.setMinutes(0);
		date.setSeconds(0);

		let date_str = null;
		if (!this.freePlaces()) {
			date_str = date.toISOString();
			console.log(date_str);
		}

		this.dataService.joinQueue(this.reservation.locationId(), {
			hours: this.reservationDuration(), date: date_str
		}).then(resp => {
			if (this.freePlaces())
				this.notificationService.addNotification({
					message: "Место найдено", type: "info", timeOut: 5000,
				});
			else
				this.notificationService.addNotification({
					message: "Вы добавлены в очередь", type: "info", timeOut: 5000,
				});
			this.router.navigate(["/user/profile"]);
		}).catch((e) => {
			this.notificationService.addNotification({
				message: e.error.message || "Попробуйте ещё раз", type: "error", timeOut: 5000,
			});
		});
	}

	wheelHandler(event: any) {
		// TODO pinch zoom
	}

	add() {
		this.reservationDuration.update(val => Math.min(12, val + 1));
	}

	remove() {
		this.reservationDuration.update(val => Math.max(1, val - 1));
	}

	protected readonly addMonthNameToDateString = addMonthNameToDateString;
};
