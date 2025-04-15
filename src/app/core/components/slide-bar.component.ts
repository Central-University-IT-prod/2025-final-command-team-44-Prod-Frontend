import { AfterViewInit, Component, effect, ElementRef, ViewChild } from "@angular/core";
import { ActivatedRoute, RouterLink, RouterLinkActive } from "@angular/router";
import { NavbarService } from "../../admin/home/services/navbar.service";

@Component({
	selector: "SlideBar",
	imports: [
		RouterLink,
	],
	styles: `
        .container {
            display:      flex;
            width:        var(--slide-bar-max);
            height:       100%;
            max-width:    var(--slide-bar-max);
            background:   var(--background-header);
            border-right: 1px solid var(--border-header);
            overflow-x:   hidden;
            overflow-y:   scroll;

            @media screen and (max-width: 1000px) {
                width:200px;
                position:            relative;
                left:                0;
                transition-duration: .3s;
                z-index:             1000;
            }

            .content {
                width:          100%;
                display:        flex;
                flex-direction: column;
                gap:            20px;
                padding:        24px 16px;
                @media screen and (max-width: 1000px) {
                    padding: 12px 8px
                }
            }

            .group {
                width:          100%;
                display:        flex;
                flex-direction: column;

                .header {
                    color:         var(--neutral-40);
                    margin-bottom: 14px;
                    font-size:     20px;
                    font-weight:   500;
                }
            }
			
            .item {
                text-decoration:  none;
                color:            var(--text-primary);
                display:          flex;
                align-items:      center;
                font-weight:      400;
                padding:          10px;
                font-size:        14px;
                border-radius:    6px;
                transition:       0.3s;
                background-color: transparent;
                cursor:           pointer;
				transition-duration: .3s;

                &:hover {
                    background-color: var(--background-neutral);
                }

                svg:not(:is(.arrow)) {
                    width:        16px;
                    margin-right: 8px;
                }
				
				.arrow {
					transition-duration: .3s;
				}
				
				&:is(.chosen) {
					background: var(--background-neutral);
				}

                @media screen and (min-width: 1000px) {
                    font-size: 19px;
                    svg {
                        width:        19px;
                        margin-right: 10px;
                    }
                }
            }
			
			.expandable {
				border-left: 1px solid var(--background-neutral);
				width: 100%;
				display: flex;
				flex-direction: column;
                transition:     all var(--slow-transition-time);
				overflow: hidden;
				margin-left: 16px;
				padding-left: 16px;
				padding-right: 16px;
                @media screen and (max-width: 1000px) {
                    padding-left: 4px;
                }
			}

            .closed {
                max-height:   0%;
            }

            .open {
                max-height:   100%;
            }
        }

        .background {
            position:        absolute;
            top:             var(--header-height);
            left:            0;
            z-index:         999;
            background:      rgba(0, 0, 0, .3);
            backdrop-filter: blur(6px);
            width:           100vw;
            height:          calc(100vh - var(--header-height));
            opacity:         0;
            display:         none;
        }
	`,
	template: `
        <div class="container" #container>
            <div class="content">
                <div class="logo">
                    <p class="text-xl font-semibold">BuiltID Analytics</p>
                </div>

                <div class="group">

                    <a routerLink="/admin/list" class="item justify-between mb-1" #expandableHeader>
						<span class="flex flex-row items-center" style="gap: 8px;">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-home">
								<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
								<path d="M5 12l-2 0l9 -9l9 9l-2 0"/>
								<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/>
								<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>
							</svg>
							Здания
						</span>
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" style="width: 24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" #expandableArrow>
                            <path d="M6 6l6 6l-6 6"/>
                        </svg>
                    </a>

                    <div class="expandable open" #expandable>
                        <a [routerLink]="'/admin/statistics/' + navbarService.locationId()" class="item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--blue-60)">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"/>
                            </svg>
                            Аналитика
                        </a>

                        <a [routerLink]="'/admin/edit/' + navbarService.locationId()" class="item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--purple-60)">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"/>
                            </svg>
                            Редактирование
                        </a>

                        <a [routerLink]="'/admin/map/' + navbarService.locationId()" class="item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgb(219,13,242)">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"/>
                            </svg>
                            Карта мест
                        </a>

                        <a [routerLink]="'/admin/tokens/' + navbarService.locationId()" class="item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--red-60)">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z"/>
                            </svg>
                            Пользователи
                        </a>
                    </div>

                </div>
            </div>
        </div>
        <div class="background" #background></div>
	`,
})
export class SlideBarComponent implements AfterViewInit {
	@ViewChild("container") container!: ElementRef<HTMLDivElement>;
	@ViewChild("background") background!: ElementRef<HTMLDivElement>;
	@ViewChild("expandableHeader") expandableHeader!: ElementRef<HTMLAnchorElement>;
	@ViewChild("expandableArrow") expandableArrow!: ElementRef<HTMLAnchorElement>;
	@ViewChild("expandable") expandable!: ElementRef<HTMLDivElement>;

	constructor(
		public navbarService: NavbarService,
		private route: ActivatedRoute,
	) {
		effect(() => {
			const id = this.navbarService.locationId();
			if (id === null) this.closeExpandable();
			else this.openExpandable();
		});
	}

	ngAfterViewInit() {
		const id = this.navbarService.locationId();
		if (id === null) this.closeExpandable();
		else this.openExpandable();
	}

	openExpandable() {
		if (this.expandable === undefined) return;
		this.expandable.nativeElement.classList.remove("closed");
		this.expandable.nativeElement.classList.add("open");
		this.expandableHeader.nativeElement.style.background = "var(--background-neutral)";
		this.expandableArrow.nativeElement.style.transform = "rotate(90deg)";
	}

	closeExpandable() {
		if (this.expandable === undefined) return;
		this.expandable.nativeElement.classList.remove("open");
		this.expandable.nativeElement.classList.add("closed");
		this.expandableHeader.nativeElement.style.background = "var(--background-secondary)";
		this.expandableArrow.nativeElement.style.transform = "rotate(0deg)";
	}
}
