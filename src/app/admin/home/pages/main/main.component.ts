import { Component, effect, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "../../../../auth/services/user.service";
import { ApiService } from "../../../../core/services/api.service";
import { CoworkingMediaService } from "../../../../user/services/coworking-media.service";
import { ReservationService } from "../../../../user/services/reservation.service";

@Component({
	selector: "app-main",
	imports: [
		FormsModule,
		MatIcon,
		MatProgressSpinner,
	],
	templateUrl: "./main.component.html",
	styleUrl: "./main.component.css",
})
export default class MainComponent implements OnDestroy {

	@ViewChild("imageElement") imageElement!: ElementRef<HTMLDivElement>;

	private _width = 100;
	protected get width() { return `${ this._width }%`; }

	protected height: string | undefined;
	protected svg: SafeHtml | undefined;

	private media: CoworkingMediaService;

	locationId: string | null = null;

	constructor(
		private sanitizer: DomSanitizer,
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private reservation: ReservationService,
		private userService: UserService,
	) {
		this.locationId = this.route.snapshot.paramMap.get("id")!;
		if (this.locationId === null) this.router.navigate(['/admin'])
		this.media = new CoworkingMediaService(this.sanitizer, this.api, this.reservation, this.router, this.userService, this.locationId);

		effect(() => {
			const svg = this.media.svg();
			if (svg !== null) {
				this.svg = svg;
				setTimeout(() => this.setStyles());
			}
		});
	}

	ngOnDestroy() {
	}

	/** sets svg styles */
	private setStyles() {
		const svg = this.imageElement.nativeElement.getElementsByTagName("svg").item(0);
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
					if (!this.reservation.checkTableAvailability(tableId))
						child.classList.add(this.media.svgNotAvailableTableStyle);

					//@ts-ignore
					child.onclick = (ev: MouseEvent) => { this.tableClickHandler(ev, tableId); };
				}

				if (child.id.includes("room")) {
					let roomId = child.id;
					// coloring not available rooms
					if (!this.reservation.checkTableAvailability(roomId))
						child.classList.add(this.media.svgNotAvailableTableStyle);

					//@ts-ignore
					child.onclick = (ev: MouseEvent) => { this.tableClickHandler(ev, roomId); };
				}
			}
		}
	}

	/** click handler on each table -> makes it reservation */
	private tableClickHandler(ev: MouseEvent, id: string) {
		console.log(id);
		this.router.navigate([`/admin/table/${this.locationId}/${id}`])
	}

	/** Zooms out svg */
	zoomOut() {
		if (this._width / 1.2 >= 50)
			this._width = this._width / 1.2;
	}

	/** Zooms in svg */
	zoomIn() {
		if (this._width * 1.2 <= 500)
			this._width = this._width * 1.2;
	}
};
