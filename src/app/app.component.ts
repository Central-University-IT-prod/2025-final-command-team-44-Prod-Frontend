import { Location } from "@angular/common";
import { Component, computed, OnDestroy, signal } from "@angular/core";
import { NavigationEnd, Router, RouterEvent, RouterOutlet } from "@angular/router";
import { filter, Subscription } from "rxjs";
import { UserService } from "./auth/services/user.service";
import { HeaderComponent } from "./core/components/header.component";
import { NotificationsComponent } from "./core/components/notifications/notifications.component";
import { SlideBarComponent } from "./core/components/slide-bar.component";
import { WebappNotificationsComponent } from "./core/components/webapp-notifications/webapp-notifications.component";
import { disableScroll, enableScroll } from "./core/utils";
import { TableReservationPopup } from "./user/popups/table-reservation.popup";
import { ReservationService } from "./user/services/reservation.service";

@Component({
	selector: "app-root",
	imports: [
		RouterOutlet,
		HeaderComponent,
		SlideBarComponent,
		TableReservationPopup,
		NotificationsComponent,
		WebappNotificationsComponent,
	],
	template: `
        <div [class.is-mobile]="!userService.isAdmin()" class="container">
            @if (!userService.isAdmin() && !isMainPage()) {
                <HeaderComp/>
            }
            <div [style.height]="(userService.isAdmin() || isMainPage()) ? '100vh' : 'calc(100vh - var(--header-height)'" class="content">
                @if (userService.isAdmin() && !isMainPage()) {
                    <SlideBar/>
                }
                <div class="scroll-container">
                    <div (scroll)="scrollHandler($event)" class="scroll-content">
                        <router-outlet/>
                        <TableReservation/>
                        @if (this.userService.isAdmin()) {
                            <Notifications/>
                        } @else {
                            <WebappNotifications/>
                        }
                    </div>
                </div>
            </div>
        </div>
	`,
	styles: `
        .container {
            width:          100vw;
            min-height:     100vh;
            position:       relative;
            display:        flex;
            flex-direction: column-reverse;
            gap:            0;
			
			&:is(.is-mobile) {
				max-width: 700px;
				margin: 0 auto;
			}

            .content {
                width:          100%;
                display:        flex;
                flex-direction: row;
                gap:            0;
				padding-top: var(--tg-top-padding);
            }

            .scroll-container {
				height: 100%;
                width:          100%;
                display:        flex;
                flex-direction: column;
                align-items:    center;
                position:       relative;

                .scroll-content {
                    max-width:  1100px;
                    padding:    24px;
                    width:      100%;
                    height:     100%;
                    overflow-y: scroll;
                }
            }
        }
	`,
})
export class AppComponent implements OnDestroy {

	isMainPage = signal<boolean>(false);

	isStatisticsPage = signal<boolean>(false);

	private routerSubscription: Subscription;

	constructor(
		private router: Router,
		public userService: UserService,
		private location: Location,
		private reservation: ReservationService,
	) {
		this.routerSubscription = this.router.events
			.pipe(filter((e) => e instanceof NavigationEnd))
			.subscribe((ev: RouterEvent) => {
				this.isMainPage.set(ev.url === '/intro' || ev.url.split('/')[1] === 'auth' || ev.url.split('/')[2] === 'join');
				this.isStatisticsPage.set(ev.url.split('/')[2] === 'statistics');
				if (!this.userService.isAdmin()) {
					if (ev.url === '/user') {
						//@ts-ignore
						window.Telegram.WebApp.BackButton.hide();
					} else {
						//@ts-ignore
						window.Telegram.WebApp.BackButton.show();
					}
				}
			});

		//@ts-ignore
		window.Telegram.WebApp.onEvent('backButtonClicked', () => {
			if (this.reservation.isPopupClosed())
				this.location.back();
		});
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
	}

	scrollHandler(event: Event) {
		if (this.isStatisticsPage()) { //@ts-ignore
			disableScroll(event.target)
			event.preventDefault()
		}
		else { //@ts-ignore
			enableScroll(event.target)
		}
	}
}
