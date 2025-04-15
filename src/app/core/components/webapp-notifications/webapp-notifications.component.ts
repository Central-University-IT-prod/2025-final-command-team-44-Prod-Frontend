import {
	AfterViewInit,
	Component,
	effect,
	ElementRef,
	OnDestroy,
	signal,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { filter, Subscription } from "rxjs";
import { ReservationService } from "../../../user/services/reservation.service";
import { NotificationModel } from "../../models/notification.model";
import { NotificationsService } from "../../services/notifications.service";

@Component({
	selector: "WebappNotifications",
	imports: [],
	styleUrl: "./webapp-notifications.component.css",
	encapsulation: ViewEncapsulation.None,
	template: `
        <div class="notifications-container" #container>
			<div (click)="removeNotification()" #notification>
                <p>Я крутое уведомление</p>
				<div></div>
            </div>
        </div>
	`,
})
export class WebappNotificationsComponent implements OnDestroy, AfterViewInit {
	@ViewChild("container") container!: ElementRef<HTMLDivElement>;
	@ViewChild("notification") notificationElement!: ElementRef<HTMLDivElement>;

	private currentTimeout: any | null = null;
	private progressTimout: any | null = null;

	private bottom: number = 20;

	private routerSubscription: Subscription;

	constructor(
		private notificationService: NotificationsService,
		public reservation: ReservationService,
		private router: Router,
	) {
		effect(() => {
			const tableId = this.reservation.reservingTable();
			if (this.container === undefined) return;
			const container = this.container.nativeElement;
			if (tableId !== null) {
				container.style.top = '20px';
				container.style.bottom = 'unset';
			}
			else {
				container.style.top = 'unset';
				container.style.bottom = `${this.bottom}px`;
			}
		});
		this.routerSubscription = this.router.events
			.pipe(filter((e) => e instanceof NavigationEnd))
			.subscribe((ev: RouterEvent) => {
				if (ev.url.split('/')[2] === 'coworking') this.bottom = 143
				else this.bottom = 20;
				if (this.container !== undefined)
					this.container.nativeElement.style.bottom = `${this.bottom}px`;
			});

		this.notificationService.queue.subscribe(queue => {
			if (queue.length === 0) return;
			this.addNotification(queue[queue.length - 1]);
			this.notificationService.popBack();
		});
	}

	ngAfterViewInit() {
		this.container.nativeElement.style.bottom = `${this.bottom}px`;
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
	}

	addNotification(notification: NotificationModel) {
		let touchPosition: null | number[] = null;

		const main_container = this.container.nativeElement;
		const container = this.notificationElement.nativeElement;
		const progressBar = container.getElementsByTagName('div').item(0)!;
		const text = container.getElementsByTagName('p').item(0)!;

		text.innerHTML = notification.message;

		if (this.currentTimeout) {
			clearTimeout(this.currentTimeout);
			clearTimeout(this.progressTimout);
		}

		main_container.style.display = 'flex';
		container.style.display = 'flex';
		progressBar.style.transitionDuration = `${ 0 }ms`;
		setTimeout(() => {
			container.style.opacity = "1";
			progressBar.style.width = '0';
			progressBar.style.transitionDuration = `${ notification.timeOut }ms`;
			this.progressTimout = setTimeout(() => {
				progressBar.style.width = "100%";
			});

			this.currentTimeout = setTimeout(() => this.removeNotification(), notification.timeOut);
		}, 100);
	}

	removeNotification() {
		const main_container = this.container.nativeElement;
		const container = this.notificationElement.nativeElement;

		if (this.currentTimeout !== null) {
			clearTimeout(this.currentTimeout);
			clearTimeout(this.progressTimout);
		}

		container.style.opacity = '0';
		setTimeout(() => {
			main_container.style.display = 'none';
			container.style.display = 'none';
		}, 300);
	}
}
