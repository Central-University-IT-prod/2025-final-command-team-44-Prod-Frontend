import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { queue } from "rxjs";
import { MyGroupResponse, QueueReponse } from "../../../../generated";
import { NotificationsService } from "../../../core/services/notifications.service";
import { UserDataService } from "../../../core/services/user-data.service";
import {
	addMonthNameToDateString,
	convertDateToHoursString,
	convertDateToString,
	parseTableName,
} from "../../../core/utils";
import { BookingPipe } from "../../pipes/booking.pipe";

@Component({
	selector: "app-profile",
	imports: [
		FormsModule,
		BookingPipe,

	],
	templateUrl: "./profile.component.html",
	styleUrl: "./profile.component.css",
})
export default class ProfileComponent {

	toggleFilter: "all" | "table" | "room" | "queue" = "all";

	cards = signal<MyGroupResponse[]>([]);
	queues = signal<QueueReponse[]>([]);

	isDeleting = false;

	constructor(
		private dataService: UserDataService,
		private notificationService: NotificationsService,
		private router: Router
	) {
		this.getMyBookings();
	}

	getMyBookings() {
		this.dataService.getUserBookings().then(bookings => {
			this.cards.set(bookings);
		});
		this.dataService.getAllQueues().then(q => {
			this.queues.set(q);
		});
	}

	navigate(id: string) {
		setTimeout(() => {
			if (!this.isDeleting) {
				this.router.navigate([`/user/booking/${id}`])
			}
		}, 10);
	}

	cancelBooking(booking: MyGroupResponse) {
		if (this.isDeleting) {
			this.notificationService.addNotification({
				message: "Подождите, удаление в прогрессе", timeOut: 5000, type: "error",
			});
			return;
		}
		this.isDeleting = true;
		this.dataService.deleteBooking(booking.booking_id)
			.then(() => {
				this.getMyBookings();
				this.isDeleting = false;
			})
			.catch(e => {
				this.isDeleting = false;
				this.notificationService.addNotification({
					message: "Вы не можете удалить это событие", timeOut: 5000, type: "error",
				});
			});
	}

	cancelQueue(queue: QueueReponse) {
		if (this.isDeleting) {
			this.notificationService.addNotification({
				message: "Подождите, удаление в прогрессе", timeOut: 5000, type: "error",
			});
			return;
		}
		this.isDeleting = true;
		this.dataService.cancelQueues(queue.location.id, queue.id)
			.then(() => {
				this.getMyBookings();
				this.isDeleting = false;
			})
			.catch(e => {
				this.isDeleting = false;
				this.notificationService.addNotification({
					message: "Вы не можете удалить это событие", timeOut: 5000, type: "error",
				});
			});
	}

	protected getName(card: MyGroupResponse): string {
		return parseTableName(card.table_name);
	};

	protected getBookingTime(card: MyGroupResponse): string {
		const start = new Date(card.time_start);
		start.setHours(start.getHours() - 3);
		const startDate = convertDateToString(start);
		const startTime = convertDateToHoursString(start);
		return `${ addMonthNameToDateString(startDate) } ${ startTime }`;
	}

	protected getQueueTime(queue: QueueReponse): string {
		const start = new Date(queue.date);
		start.setHours(start.getHours() - 3);
		const startDate = convertDateToString(start);
		const startTime = convertDateToHoursString(start);
		return `${ addMonthNameToDateString(startDate) } ${ startTime }`;
	}
}
