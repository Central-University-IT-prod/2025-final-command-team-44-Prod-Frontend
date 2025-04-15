import {
	AfterViewInit,
	Component,
	effect,
	ElementRef, model,
	QueryList,
	signal,
	ViewChild,
	ViewChildren,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { MyGroupResponse, UserMe } from "../../../../generated";
import { UserService } from "../../../auth/services/user.service";
import { NotificationsService } from "../../../core/services/notifications.service";
import { UserDataService } from "../../../core/services/user-data.service";
import {
	addMonthNameToDateString,
	convertDateToHoursString,
	convertDateToString,
	copyToClipboard,
	parseTableName,
} from "../../../core/utils";
import { TableReservationPopup } from "../../popups/table-reservation.popup";

@Component({
	selector: "app-booking",
	imports: [
		MatProgressSpinner,
		FormsModule,
	],
	templateUrl: "./booking.component.html",
	styleUrl: "./booking.component.css",
})
export default class BookingComponent implements AfterViewInit {
	@ViewChildren("action") actions!: QueryList<ElementRef<HTMLDivElement>>;
	@ViewChild("background") background!: ElementRef<HTMLDivElement>;
	@ViewChild("activeContent") activeContent!: ElementRef<HTMLDivElement>;

	booking!: MyGroupResponse;

	members = signal<UserMe[]>([]);

	loaded = signal<boolean>(false);

	openedMenu: number = 0;

	availableDuration: number[] = [];
	availableDates: string[] = [];
	availableTimes: string[] = [];

	reservationDate = model<string>('');
	reservationTime = model<string>("");
	reservationDuration = model<number>(1);

	protected get name() {
		return parseTableName(this.booking.table_name);
	}

	protected get time(): string {
		const start = new Date(this.booking.time_start);
		start.setHours(start.getHours() - 3);
		const startDate = convertDateToString(start);
		const startTime = convertDateToHoursString(start);

		const end = new Date(this.booking.time_end);
		end.setHours(end.getHours() - 3);
		const endDate = convertDateToString(end);
		const endTime = convertDateToHoursString(end);

		return `${ addMonthNameToDateString(startDate) } ${ startTime } - ${ startDate === endDate ? "" : addMonthNameToDateString(endDate) } ${ endTime }`;
	}

	protected get status(): string {
		if (this.booking.status === 'creator')
			return 'Создатель'
		return 'Участник';
	}

	constructor(
		public userService: UserService,
		private route: ActivatedRoute,
		private router: Router,
		private dataService: UserDataService,
		private notificationService: NotificationsService,
	) {
		effect(() => {
			const loaded = this.loaded();
			setTimeout(() => {
				const action = this.actions.get(0)?.nativeElement;
				if (action !== undefined) {
					this.activeContent.nativeElement.style.top = `${ action.offsetTop + action.offsetHeight + 20 }px`;
				}
			}, 100);
		});
		/** adding listener to change available time slots */
		effect(() => {
			const date = this.reservationDate();
			if (date !== "") this.setUpTimeSlots();
		});

		this.getBooking();
		this.setUpDateSlots();
	}

	ngAfterViewInit() {
		const action = this.actions.get(0)?.nativeElement;
		if (action !== undefined)
			this.activeContent.nativeElement.style.top = `${ action.offsetTop + action.offsetHeight + 20 }px`;
	}

	/** sets available dates */
	setUpDateSlots() {
		const today = new Date();

		this.availableDuration = [];
		for (let i = 1; i <= 12; i++) {
			this.availableDuration.push(i);
		}
		this.reservationDuration.set(1);

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

	getBooking() {
		const id = this.route.snapshot.paramMap.get("id");
		if (id === null) {
			this.router.navigate(["/user/profile"]);
			return;
		}

		const setup = () => {
			const booking = this.dataService.getBookingById(id);
			if (booking === null) {
				this.router.navigate(["/user/profile"]);
				return;
			}

			this.booking = booking;
			this.dataService.getBookingMembers(id).then(members => {
				this.members.set(members);
				this.loaded.set(true);
			});
		};

		if (this.dataService.userBookings.length === 0)
			this.dataService.getUserBookings().then(() => setup());
		else
			setup();
	}

	isAdmin(user: UserMe) {
		return user.username === this.userService.currentUser()?.username;
	}

	getImgName(name: string): string {
		for (let i = 0; i < TableReservationPopup.availablePreferences.length; i++) {
			if (TableReservationPopup.availablePreferences[i] === name)
				return "preferences/" + TableReservationPopup.availablePreferencesSvgs[i] + ".svg";
		}
		return "";
	}

	sendLink() {
		const link = encodeURI(this.booking.invite_url);
		const text = encodeURI(`Присоединяйтесь к моей встрече. ${ this.name }`);
		const url = `https://t.me/share/url?url=${ link }&text=${ text }`;
		//@ts-ignore
		window.Telegram.WebApp.openTelegramLink(url);
	}

	async copyLink() {
		const link = this.booking.invite_url;
		await copyToClipboard(link, this.notificationService);
	}

	open(id: number) {
		this.openedMenu = id;

		const element = this.actions.get(this.openedMenu)?.nativeElement!;
		const content = this.activeContent.nativeElement;
		const bg = this.background.nativeElement;

		element.style.zIndex = "1300";
		setTimeout(() => {
			bg.style.display = "block";
			content.style.display = "flex";
			setTimeout(() => {
				bg.style.opacity = "1";
				setTimeout(() => {
					content.style.maxHeight = "100vw";
				}, 300);
			}, 100);
		}, 100);
	}

	close() {
		const element = this.actions.get(this.openedMenu)?.nativeElement!;
		const content = this.activeContent.nativeElement;
		const bg = this.background.nativeElement;

		content.style.maxHeight = "0vw";
		setTimeout(() => {
			bg.style.opacity = "0";
			setTimeout(() => {
				bg.style.display = "none";
				content.style.display = "flex";
				setTimeout(() => {
					element.style.zIndex = "1";
				}, 100);
			}, 300);
		}, 300);
	}

	getHours() {
		const start = new Date(this.booking.time_start);
		const end = new Date(this.booking.time_end);
		const delta = end.getHours() - start.getHours();
		console.log(delta); // TODO change test
		return delta;
	}

	edit() {
		let time_start = this.booking.time_start;
		let hours = this.getHours();

		if (this.openedMenu === 0) {
			const date = new Date();
			const [day, month] = this.reservationDate().split('.');
			const [hours, minutes] = this.reservationTime().split(':');
			date.setMonth(Number(month));
			date.setDate(Number(day));
			date.setHours(Number(hours)+3);
			date.setMinutes(0);
			date.setSeconds(0);
			time_start = date.toISOString();
		} else {
			hours = this.reservationDuration();
		}

		this.dataService.editBooking(this.booking.booking_id, {
			people_amount: this.booking.people_amount,
			features: this.booking.features,
			comment: this.booking.comment,
			time_start: time_start,
			hours: hours,
		}).then(resp => {
			this.getBooking();
			this.notificationService.addNotification({
				message: '', type: 'info', timeOut: 5000,
			});
			this.close();
		}).catch(e => {
			console.log(e);
			this.notificationService.addNotification({
				message: e.error.detail, type: 'info', timeOut: 5000,
			});
		})
	}

	removeUser(mem: UserMe) {

	}

	protected readonly addMonthNameToDateString = addMonthNameToDateString;
}
