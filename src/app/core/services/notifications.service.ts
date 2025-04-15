import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { v4 as uuid } from "uuid";
import { NotificationModel } from "../models/notification.model";

@Injectable({
	providedIn: "root",
})
export class NotificationsService {
	queue = new BehaviorSubject<Array<NotificationModel>>([]);

	constructor() { }

	addNotification(notification: NotificationModel) {
		notification.id = uuid();
		const queue = this.queue.value;
		queue.push(notification);
		this.queue.next(queue);
	}

	popBack() {
		const queue = this.queue.value;
		if (queue.length === 0) return;
		queue.pop();
		this.queue.next(queue);
	}
}
