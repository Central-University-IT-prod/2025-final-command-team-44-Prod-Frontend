import { Component, effect, ElementRef, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { LocationResponse } from "../../../../../generated";
import { DataService } from "../../../../core/services/data.service";
import { NotificationsService } from "../../../../core/services/notifications.service";
import { NavbarService } from "../../services/navbar.service";

@Component({
	selector: "app-display",
	imports: [FormsModule, MatProgressSpinner],
	templateUrl: "./edit.component.html",
	styleUrl: "./edit.component.css",
})
export default class EditComponent {
	@ViewChild("block") block!: ElementRef<HTMLDivElement>;

	errors: Record<string, string> = {
		name: "",
		address: "",
	};

	public location: LocationResponse | null = null;

	blockCount = signal<number>(0);

	shownSvg = signal<string | null>(null);

	file: any = null;

	svgContent = signal<SafeHtml | null>(null);

	svgChange = signal<boolean>(true);

	constructor(
		private dataService: DataService,
		private route: ActivatedRoute,
		private navbarService: NavbarService,
		private notificationService: NotificationsService,
		private sanitizer: DomSanitizer,
	) {
		this.setUpLocation();
		effect(() => {
			const svg = this.shownSvg();
			const change = this.svgChange();
			console.log(svg);
			if (svg && change)
				this.checkSvgAvailable();
		});
		effect(() => {
			const count = this.blockCount();
			if (this.block === undefined) return;
			if (count === 0) {
				this.block.nativeElement.style.display = "none";
			}
			else {
				this.block.nativeElement.style.display = "flex";
			}
		});
	}

	setUpLocation() {
		const id = this.route.snapshot.paramMap.get("id");
		this.navbarService.locationId.set(id);
		if (id === null) return;
		this.dataService.getLocationById(id)
			.then(location => {
				this.location = location;
				this.shownSvg.set(this.location.svg);
			});
	}

	checkSvgAvailable() {
		const svg = this.shownSvg();
		console.log('new call');
		if (svg === null) {
			this.svgContent.set(null);
			return;
		}
		fetch(svg)
			.then(resp => {
				if (resp.ok) {
					resp.text().then(text => {
						if (this.blockCount() !== 0) {
							this.blockCount.update(count => Math.max(0, count - 1));
							this.notificationService.addNotification({
								type: "info",
								timeOut: 5000,
								message: "Новый план добавлен",
							});
						}
						this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(text));
					});
				}
				else
					this.svgContent.set(null);
				this.svgChange.set(false);
			})
			.catch(e => {
				this.svgContent.set(null);
			});
	}

	validateName(): boolean {
		if (this.location === null) return false;
		if (this.location.name.length < 3) {
			this.errors["name"] = "Название слишком короткое";
			return false;
		}
		return true;
	}

	validate() {
		if (!this.validateName()) return false;
		return true;
	}

	svgChoiceHandler(event: any) {
		const input = event.target;
		this.file = input.files[0];
	}

	save() {
		if (this.validate()) {
			if (this.file !== null) {
				this.blockCount.update(count => count + 1);
				this.dataService.editLocationSVG(this.location?.id, this.file)
					.then(resp => {
						this.svgChange.set(true);
						this.shownSvg.set(resp!.svg);
					})
					.catch(e => {
						this.notificationService.addNotification({
							type: "error",
							timeOut: 5000,
							message: e.message || 'Непредвиденная ошибка, попробуйте ещё раз',
						});
					});
			}
			this.blockCount.update(count => count + 1);
			this.dataService.editLocation(this.location!.id, this.location?.name, this.location?.address, this.location?.open_hour, this.location?.close_hour)
				.then(() => {
					this.blockCount.update(count => count - 1);
					this.notificationService.addNotification({
						type: "info",
						timeOut: 5000,
						message: "Текстовые изменения сохранены",
					});
				})
				.catch(e => {
					console.log(e);
					this.notificationService.addNotification({
						type: "error",
						timeOut: 5000,
						message: e.message || 'Непредвиденная ошибка, попробуйте ещё раз',
					});
				})
		}
	}
}
