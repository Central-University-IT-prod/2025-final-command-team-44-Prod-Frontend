import { Component, effect, ElementRef, model, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { Router } from "@angular/router";
import { UserService } from "../../auth/services/user.service";
import { NotificationsService } from "../../core/services/notifications.service";
import { addMonthNameToDateString, parseTableName } from "../../core/utils";
import { TimeSlotModel } from "../models/time-slot.model";
import { ReservationService } from "../services/reservation.service";

@Component({
	selector: "TableReservation",
	imports: [
		FormsModule,
		MatIcon,
	],
	styles: `
        .bg {
            position:        fixed;
            top:             0;
            left:            0;
            display:         none;
            opacity:         0;
            width:           100vw;
            height:          100vh;
            z-index:         999;
            background:      rgba(from var(--neutral-1) r g b / 30%);
            backdrop-filter: blur(10px);
        }

        .container {
            flex-direction:      column;
            max-height:          0;
            height:              100vh;
            width:               100vw;
            position:            fixed;
            bottom:              0;
            background:          var(--background-secondary);
            z-index:             1000;
            border-radius:       var(--br-16) var(--br-16) 0 0;
            transform:           translateX(-50%);
            display:             none;
            transition-duration: var(--fast-transition-time);
            overflow-y:          scroll;
            left:                50%;
            max-width:           700px;

            .scroll-content {
                box-sizing:     content-box;
                flex-direction: column;
                display:        flex;
                gap:            8px;
                padding:        16px;
            }
        }

        .select {
            background: var(--background-primary);
        }

        .close-svg {
            position: fixed;
            top:      16px;
            right:    16px;
        }

        .time-p {
            padding:       3px 16px;
            background:    rgba(from var(--neutral-0) r g b / 0.5);
            border-radius: var(--br-100);
            color:         var(--background-secondary);
            width:         fit-content;
            height:        fit-content;
        }

        .btn-black {
            width:      100%;
            background: var(--background-primary);

            &:hover {
                background: var(--background-neutral);
            }
        }
	`,
	template: `
        <div class="bg" (click)="hide()" #background></div>
        <div (touchstart)="handleTouchStart($event)" [class.is-mobile]="!userService.isAdmin()" class="container" #container>
            <div class="scroll-content">
                <div class="mb-5">
                    <svg class="cursor-pointer close-svg" (click)="hide()" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M18 6l-12 12"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                    <p class="text-3xl font-semibold">{{ getName(tableId ?? '') }}</p>
                    <p class="time-p">{{ getReservationTime() }}
                    </p>
                </div>

                <p class="text-xl">Отметьте дополнительные фичи</p>
                <div class="grid grid-cols-2 gap-2 mb-3">
                    @for (pref of availablePreferences; track availablePreferences) {
                        <label style="max-width: unset;" class="dark">
                            <input [checked]="preferences.indexOf(pref) !== -1" (change)="addPreference(pref)" type="checkbox">
                            <p>{{ pref }}</p>
                        </label>
                    }
                </div>

                <p class="text-xl">Комментарий к бронированию</p>
                <label style="max-width: unset;" class="dark mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/>
                        <path d="M13.5 6.5l4 4"/>
                    </svg>
                    <input [(ngModel)]="preferenceString" type="text" placeholder="Напишите, что нам нужно учесть...">
                </label>

                @if (availablePeoplesCount.length > 1) {
                    <p class="text-xl">Количество человек</p>
                    <div class="flex flex-row w-full gap-3">
                        <div class="select w-full dark mb-5">
                            <select [(ngModel)]="peoplesCount">
                                @for (count of availablePeoplesCount; track [availablePeoplesCount]) {
                                    <option>{{ count }}</option>
                                }
                            </select>
                        </div>

                        <div class="w-[52px] h-[52px]">
                            <button style="width: 52px; height: 52px; padding: 0;" class="small-button btn-black" (click)="remove()">
                                <mat-icon>remove</mat-icon>
                            </button>
                        </div>

                        <div class="w-[52px] h-[52px]">
                            <button style="width: 52px; height: 52px; padding: 0;" class="small-button btn-black" (click)="add()">
                                <mat-icon>add</mat-icon>
                            </button>
                        </div>
                    </div>
                }

                <button style="width: 100%; margin: auto 0 0;" class="medium-button" (click)="submit()">Забронировать</button>
            </div>
        </div>
	`,
})
export class TableReservationPopup {
	public static availablePreferences: string[] = ["Ручка", "Бумага", "Мышка", "HDMI-провод", "Клавиатура", "Монитор"];
	public static availablePreferencesSvgs: string[] = ["pen", "paper", "mouse", "hdmi", "keyboard", "monitor"];

	@ViewChild("container") container!: ElementRef<HTMLDivElement>;
	@ViewChild("background") background!: ElementRef<HTMLDivElement>;

	preferences: string[] = [];
	preferenceString: string = "";
	availablePeoplesCount: number[] = [];

	peoplesCount = model<number>(1);

	tableId: string | null = null;

	protected get availablePreferences() {
		return TableReservationPopup.availablePreferences;
	}

	/** Maximum height of the container */
	private readonly MAX_HEIGHT = window.innerHeight - 140;
	/** Minimum height of the container */
	private MIN_HEIGHT: number = 0;
	/** Minimum deltaY to interact with the container */
	private MIN_INTERACTION_DELTA: number = 150;

	constructor(
		public reservation: ReservationService,
		public userService: UserService,
		private notification: NotificationsService,
		private router: Router,
	) {
		effect(() => {
			this.tableId = this.reservation.reservingTable();
			this.preferences = [];
			this.preferenceString = "";
			this.peoplesCount.set(1);
			if (this.tableId !== null) {
				this.show();
				this.setUpAvailablePeoplesCount();

				setTimeout(() => {
					//@ts-ignore
					window.Telegram.WebApp.onEvent("backButtonClicked", () => {
						this.hide();
					});
				}, 100);
			}
			else this.hide();
		});
	}

	async setUpAvailablePeoplesCount() {
		this.availablePeoplesCount = [1];
		if (this.tableId?.includes("room")) {
			//const room = await this.dataService.getTableById(this.tableId, this.reservation.locationId);
			for (let i = 2; i <= 5; i++) /* TODO change right side to room.max_people_amount */
				this.availablePeoplesCount.push(i);
		}
	}

	getReservationTime(): string {
		const interval = this.reservation.reservationTime!;
		if (interval === null) return "";
		const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		let finishMonth = Number(interval.start.date.split(".")[1]);
		let finishDay = Number(interval.start.date.split(".")[0]);
		let finishHours = Number(interval.start.time.split(":")[0]);

		finishHours += Number(interval.hoursCount);
		finishDay += Math.floor(finishHours / 24);
		finishHours %= 24;
		while (finishDay > days[finishMonth - 1])
			finishDay -= days[finishMonth - 1], finishMonth = ( finishMonth + 1 ) % 12;

		const finish: TimeSlotModel = {
			date: `${ String(finishDay).padStart(2, "0") }.${ String(finishMonth).padStart(2, "0") }`,
			time: `${ String(finishHours).padStart(2, "0") }:00`,
		};

		return `${ addMonthNameToDateString(interval.start.date) } ${ interval.start.time } - ${ finish.date === interval.start.date ? "" : addMonthNameToDateString(finish.date) } ${ finish.time }`;
	}

	show() {
		this.reservation.isPopupClosed.set(false);
		if (this.background === undefined) return;

		const bg = this.background.nativeElement;
		const container = this.container.nativeElement;

		bg.style.display = 'block';
		container.style.display = "flex";
		container.style.transitionDuration = ".3s";
		setTimeout(() => {
			bg.style.opacity = '1';
			container.style.maxHeight = `70vh`;
		}, 100);
		setTimeout(() => {
			container.style.transitionDuration = "0s";
		}, 400);
	}

	hide() {
		if (this.background === undefined) return;
		if (this.reservation.reservingTable() === null) return;
		const bg = this.background.nativeElement;
		const container = this.container.nativeElement;

		container.style.transitionDuration = ".3s";
		setTimeout(() => {
			bg.style.opacity = '0';
			container.style.maxHeight = "0vh";
		}, 100);
		setTimeout(() => {
			container.style.display = "none";
			container.style.transitionDuration = "0s";
			bg.style.display = "none";
			this.reservation.isPopupClosed.set(true);
		}, 400);

		if (this.reservation.reservingTable() !== null) {
			this.reservation.reservingTable.set(null);
		}
	}

	add() {
		this.peoplesCount.update(val => Math.min(12, val + 1));
	}

	remove() {
		this.peoplesCount.update(val => Math.max(1, val - 1));
	}

	addPreference(name: string) {
		if (this.preferences.indexOf(name) === -1)
			this.preferences.push(name);
		else
			this.preferences = this.preferences.filter(pref => pref !== name);
	}

	submit() {
		this.reservation.makeReservation(this.tableId!, this.preferences, this.preferenceString, this.peoplesCount())
			.then(() => {
				this.hide();
				this.notification.addNotification({
					timeOut: 2000, message: "Бронь успешно создана", type: "info",
				});
				this.router.navigate(["/user/profile"]);
			})
			.catch((e: any) => {
				console.log(e);
				this.notification.addNotification({
					timeOut: 5000, message: e.error.message || "Попробуйте ещё раз позже", type: "error",
				});
			});
	}

	/** Handler for container touch start event */
	handleTouchStart(event: TouchEvent) {
		const container = this.container.nativeElement; // container element
		const startTouchY = event.changedTouches[0].clientY;
		let deltaWithOutScroll = 0;
		let lastY = event.touches[0].clientY; // initial y scroll position

		/** Handler for touch end event */
		const handleTouchEnd = () => {
			// sticking container height to one of the values
			const currentTouchY = lastY;
			const currentHeight = container.getBoundingClientRect().height;
			container.style.transitionDuration = ".3s";
			setTimeout(() => {
				if (startTouchY < currentTouchY) { // scrolling to bottom ⬇ and we want to minimize container height
					if (deltaWithOutScroll >= this.MIN_INTERACTION_DELTA)
						this.hide();
					else {
						if (currentHeight <= 100)
							this.show();
						else
							container.style.maxHeight = `${ this.MAX_HEIGHT }px`;
					}
				} else { // scrolling to top ⬆ and we want container to expand
					if (deltaWithOutScroll >= this.MIN_INTERACTION_DELTA)
						container.style.maxHeight = `${ this.MAX_HEIGHT }px`;
					else {
						if (currentHeight <= 100)
							this.hide();
						else
							container.style.maxHeight = `${ this.MAX_HEIGHT }px`;
					}
				}
			});
			setTimeout(() => {
				container.style.transitionDuration = "0s";
				if (container.getBoundingClientRect().height === 0)
					this.hide();
			}, 300);

			// removing event listeners
			container.removeEventListener("touchmove", handleTouchMove);
			container.removeEventListener("touchend", handleTouchEnd);
		};
		/** Handler for touch move event */
		const handleTouchMove = (event: TouchEvent) => {
			const currentY = event.touches[0].clientY;
			let delta = lastY - currentY;

			if (delta > 0) { // scrolling to top ⬆
				/* we should first add maxHeight of the container
				* then if it is 100vh we should scroll the content */
				const currentHeight = container.getBoundingClientRect().height;
				const currentScroll = container.scrollTop;
				let addToHeight = Math.min(delta, this.MAX_HEIGHT - currentHeight);

				if (addToHeight > 0) { // we should add to maxHeight of the container
					container.style.maxHeight = `${ currentHeight + addToHeight }px`;
					delta -= addToHeight;
					deltaWithOutScroll += addToHeight;
				}

				if (delta > 0) { // we should scroll the content
					container.scrollTo({ top: currentScroll + delta });
				}
			} else { // scrolling to bottom ⬇
				/* here first we should scroll content till the top
				* then we decrease container maxHeight */
				delta = Math.abs(delta);
				const currentHeight = container.getBoundingClientRect().height;
				const currentScroll = container.scrollTop;
				let addToScroll = Math.min(delta, currentScroll);

				if (addToScroll > 0) { // we should scroll the content
					container.scrollTo({ top: currentScroll - addToScroll });
					delta -= addToScroll;
				}

				if (delta > 0) { // we should add to maxHeight of the container
					container.style.maxHeight = `${ Math.max(this.MIN_HEIGHT, currentHeight - delta) }px`;
					deltaWithOutScroll += delta;
				}
			}

			lastY = currentY;
		};

		container.addEventListener("touchmove", handleTouchMove);
		container.addEventListener("touchend", handleTouchEnd);
	}

	protected getName(tableName: string): string {
		return parseTableName(tableName);
	};
}
