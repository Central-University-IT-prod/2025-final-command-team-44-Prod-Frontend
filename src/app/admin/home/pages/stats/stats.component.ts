import { AfterViewChecked, Component, computed, ElementRef, HostListener, inject, Signal, signal, ViewChild, WritableSignal } from '@angular/core';
import { DataService } from '../../../../core/services/data.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { NavbarService } from '../../services/navbar.service';
import {DateType, IdType, Timeline, TimelineGroup, TimelineItem} from 'vis-timeline'
import { DataSet } from 'vis-data';
import { TimeIntervalModel, TimeSlotModel } from '../../../../user/models/time-slot.model';
import moment, { localeData, MomentInput } from 'moment';
import { BookingCard } from '../../interfaces/booking-card';
import { FormsModule } from '@angular/forms';
import { BookingAdminResponse, CreateBooking, CreateBookingAdmin, TableResponse, UpdateBooking, UserBookingForAdmin } from '../../../../../generated';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule, TooltipComponent} from '@angular/material/tooltip';
import { NotificationsService } from '../../../../core/services/notifications.service';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-stats',
  imports: [FormsModule, MatButtonModule, MatTooltipModule, MatSpinner, MatIcon],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export default class StatsComponent {

  @ViewChild("tcontainer") tcontainerRef !: ElementRef;
  @ViewChild("bcontainer") bcontainerRef !: ElementRef;
  @ViewChild("tooltip") tooltip !: TooltipComponent;



	timeline: Timeline | null = null;

	dataService: DataService;

	buildingId: string = "";

	route: ActivatedRoute;

	prevItem: {
		id: string,
		start: number | string | DateType,
		end: number | string | DateType,
		group: string
	} | null = null;

	isNewBooking = signal<boolean>(false);

  newFeature = signal<boolean>(false)

  fullyLoaded = signal<boolean>(true)
  

	scroll = signal<boolean>(false);

	newFeatures = signal<string[]>([]);

	errorMsg = signal<string>("");

	featureVal: string = "";

	addFeature() {
		if (!this.featureVal)
			return;
		this.newFeatures.update(val => {
			val.push(this.featureVal);
			return val;
		});
		this.featureVal = "";
		this.newFeature.set(false);

	}

	removeFeature(idx: number) {
		this.newFeatures.update(val => {
			val.splice(idx, 1);
			return val;
		});

	}

	tableData: WritableSignal<TableResponse[]> = signal<TableResponse[]>([]);

	bookData: WritableSignal<BookingCard[]> = signal<BookingCard[]>([]);

	chosenBookData: Signal<BookingCard> = computed(() => {
		console.log(this.chosenBookId());
		const found = this.bookData().find((val) => {
			console.log(val);
			if (val.booking_id === this.chosenBookId())
				return true;
			return false;
		});

		if (found)
			return found;
		else return {
			booking_id: "",
			time_start: "",
			time_end: "00:00",
			date_start: "00.00",
			date_end: "00.00",
			code: "",
			table_id: "",
			telegram_username: "",
			name: "",
			comment: "",
			features: [],
			amount: 1,
			members: [],
		};

	});

	chosenBookId = signal<string>("");

	dataGroups  !: DataSet<TimelineGroup>;

	focus_id: string | null = null;

	nameVal: string = "";

	usernameVal: string = "";

	telVal: string = "";

	commentVal: string = "";

	amountVal: number = 1;

	sTimeVal: string = "";

	eTimeVal: string = "";

	dataItems !: DataSet<TimelineItem>;

	loaded = signal<boolean>(false);


	navService: NavbarService;

	constructor(
		private notificationService: NotificationsService,
	) {
		this.dataService = inject(DataService);
		this.route = inject(ActivatedRoute);
		this.navService = inject(NavbarService);

		this.setUpBuilding();
		this.dataService.getTablesByLocation(this.navService.locationId() as string).then((val) => {
			this.tableData.set(val);
			this.setupTableData();

			this.dataService.getBookingsByLocation(this.navService.locationId() as string).then((val2) => {
				this.bookData.set(this.parse(val2));
				this.setupDataItems();
				this.setupTimeline();
				this.setUpFocus();
				console.log(this.focus_id);
				this.setupInputData();
				if (this.focus_id) {
					this.setupPrevItem(this.dataItems.get(this.focus_id) as TimelineItem);
				}
			}).catch(e => {
				this.notificationService.addNotification({
					type: "error",
					message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
					timeOut: 5000,
				});
			});
		}).catch(e => {
			this.notificationService.addNotification({
				type: "error",
				message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
				timeOut: 5000,
			});
		});
	}

	findCreator(users: UserBookingForAdmin[]) {
		return users.find(el => {
			return el.status === "creator";
		});
	}

	parse(res: BookingAdminResponse[]): BookingCard[] {
		let toReturn: BookingCard[] = [];
		res.forEach(el => {
			let creator = this.findCreator(el.users);
			toReturn.push({
				name: creator?.first_name,
				telegram_username: creator?.username,
				time_start: el.time_start.slice(11, 16),
				time_end: el.time_end.slice(11, 16),
				date_start: el.time_start.split("T")[0].split("-")[2] + "." + el.time_start.split("T")[0].split("-")[1],
				date_end: el.time_end.split("T")[0].split("-")[2] + "." + el.time_end.split("T")[0].split("-")[1],
				booking_id: el.id,
				code: el.code,
				features: el.features,
				comment: el.comment,
				amount: el.people_amount,
				members: el.users,
				table_id: el.table_id,
			});
		});
		return toReturn;
	}



    setupTimeline(){
      if(!this.tcontainerRef)
        return
      this.loaded.set(true)
      this.timeline = new Timeline(this.tcontainerRef.nativeElement, 
        //@ts-ignore
        this.dataItems,
        this.dataGroups,
       {
        editable:{
			updateGroup:false, 
			remove:false,
			add:true, 
			updateTime:true
		},
        stack: false,
        onMove: (item, callback) => {
          callback(item)
          this.adjustOthers(item)
          this.setInputsTime(item)
        },
        snap:this.snap,
        onAdd : (item, callback) => {
          this.addNew(item)
          callback(item)
          this.timeline?.setSelection(item.id)
          this.timeline?.focus(item.id)
          this.chosenBookId.set(item.id.toString())
          this.setupInputData()
          this.setInputsTime(item)
          this.isNewBooking.set(true)
        },

				onUpdate: (item, callback) => {
					this.timeline?.focus(item.id);
				},

        

        onInitialDrawComplete: () => {setTimeout(() => {
          this.fullyLoaded.set(false)
          console.log(this.fullyLoaded())
          this.returnScrollBack()
        }, 1000)},


				maxHeight: window.innerWidth < 1000 ? window.innerHeight - 150 : window.innerHeight - 180,
				zoomable: true,
				zoomMin: 1000 * 60 * 60 * 3,
				zoomMax: 1000 * 60 * 60 * 5 * 24,
				verticalScroll: true,
				zoomKey: "ctrlKey",
				locale: "ru",

				moment: (date: MomentInput) => {
					return moment(date).utcOffset("+03:00");
				},
			});
		this.timeline.on("select", props => {
			this.isNewBooking.set(false);
			console.log(this.prevItem);

			let itemId: string = props.items[0];

			//@ts-ignore
			let item: TimelineItem = this.dataItems.get(itemId);
			if (this.prevItem) {
				this.dataItems.update({
					id: this.prevItem.id,
					start: this.prevItem.start,
					end: this.prevItem.end,
					group: this.prevItem.group,
				});
			}

			this.setupPrevItem(item);

			this.dataItems.forEach(el => {
				if (!this.bookData().find(val => {
					return el.id === val.booking_id;
				})) {
					this.dataItems.remove(el);
				}
			});

			if (props.items.length > 1) {
				return;
			}


			this.chosenBookId.set(itemId);

			this.setInputsTime(item);

			console.log(this.eTimeVal);

			this.setupInputData();

			console.log(this.eTimeVal);
		});
	}

	setupInputData() {
		this.nameVal = this.chosenBookData().name;
		this.telVal = "";
		this.usernameVal = this.chosenBookData().telegram_username;
		this.commentVal = this.chosenBookData().comment;
		this.amountVal = this.chosenBookData().amount;
		console.log();
		this.newFeatures.set(this.chosenBookData().features.slice());

	}

	setupTableData() {
		let temp: TimelineGroup[] = [];
		this.tableData().forEach(el => {
			temp.push({
				id: el.id,
				content: el.table_name,
			});
		});

		this.dataGroups = new DataSet(temp);
		console.log(this.dataGroups.get());

	}

	setUpBuilding() {
		const id = this.route.snapshot.paramMap.get("id");
		this.navService.locationId.set(id);
	}

	setUpFocus() {
		this.focus_id = this.route.snapshot.queryParamMap.get("focus_id");
		if (this.focus_id) {
			this.chosenBookId.set(this.focus_id);
			//@ts-ignore
			this.setInputsTime(this.dataItems.get(this.focus_id));
		}


	}


	setupDataItems() {
		let temp: TimelineItem[] = [];
		this.bookData().forEach(el => {
			temp.push({
				id: el.booking_id,
				content: el.name,
				start: this.toNormalDate(el.date_start, el.time_start),
				end: this.toNormalDate(el.date_end, el.time_end),
				group: el.table_id,
				type: "range",
				className: "item",
			});
		});

		this.dataItems = new DataSet(temp);
		console.log(this.dataItems.get());
	}


	async ngAfterViewInit() {
		console.log(this.timeline);
		this.setupInputData();

	}

	toNormal(item: string | DateType | number) {
		if (typeof item != "number") {
			if (typeof item == "string") {
				item = Date.parse(item);
			}
			else {
				item = Date.parse(item.toString());
			}
		}
		return item;
	}


	setInputsTime(item: TimelineItem) {
		if (!item || !item.start)
			return;
		console.log(item.start);

		item.start = this.toNormal(item.start);

		if (!item.end)
			return;

		item.end = this.toNormal(item.end);

		let hours = Math.floor(( item.end - item.start ) / ( 1000 * 3600 ));

		console.log(item.start);
		console.log(item.end);
		console.log(hours);
		this.eTimeVal = String(hours);
		this.sTimeVal = new Date(item.start + 3000 * 3600).toISOString().slice(0, 16);
	}

    returnScrollBack = () => {
      
      if(!this.focus_id){
        let minS = this.dataItems.min("start")
        this.timeline?.focus(minS?.id)
        
      }
      else{
        console.log(this.timeline)
        this.timeline?.focus(this.focus_id)
        this.timeline?.setSelection(this.focus_id)
      }
    }

    setupPrevItem(item : TimelineItem){
      if(!item.end)
        return
      this.prevItem = {
        id: item.id as string,
        start: item.start,
        end: item.end,
        group: item.group as string
      }
    }


	normalizeTime(timeVal: string) {
		let nTS: string = timeVal.split("T")[0] + "T"
			+ timeVal.split("T")[1].slice(0, 3) + "00";

		return nTS;
	}

	normAll() {
		this.sTimeVal = this.normalizeTime(this.sTimeVal);
	}

	onChangeTime = () => {
		this.normAll();
		if (this.timeline!.getSelection().length != 1)
			return;

		let selId: IdType = this.timeline!.getSelection()[0];

		//@ts-ignore
		this.dataItems.update({
			id: selId, start: this.sTimeVal, end: this.toNormal(this.sTimeVal) + Number(this.eTimeVal) * 1000 * 3600,
		});

		this.timeline?.focus(selId);
		//@ts-ignore
		this.adjustOthers(this.dataItems.get(selId));
	};

	addNew = (item: TimelineItem) => {
		item.content = "Бронь";
		item.type = "range";
		if (!item.end || item.end < item.start) {
			item.end = new Date(Date.parse(item.start.toString()) + 1000 * 60 * 60);
		}
		else {
			item.end = new Date(
				Math.round(( Date.parse(item.end.toString()) / ( 1000 * 60 * 60 ) ))
				* 1000 * 60 * 60);
		}
	};


	adjustOthers = (item: TimelineItem) => {
		if (!item || !item.end || !item.start) {
			return;
		}

		let start: number = Date.parse(item.start.toString());

		let end: number = Date.parse(item.end.toString());

		if (end - start < 3600 * 1000) {
			this.dataItems.update({
				id: item.id,
				end: start + 3600 * 1000,
			});
			item.end = new Date(start + 3600 * 1000);
		}

		if (end - start > 3600 * 1000 * 12) {
			this.dataItems.update({
				id: item.id,
				end: start + 3600 * 1000 * 12,
			});

			this.notificationService.addNotification({
				message: "Максимальное время бронирования",
				type: "warning",
				timeOut: 5000,
			});
			item.end = new Date(start + 3600 * 1000 * 12);
			return;
		}


	};



	snap = (date: Date, scale: string, step: number) => {
		return this.roundToHour(date);
	};

	roundToHour(date: Date) {
		let p = 60 * 60 * 1000;
		return new Date(Math.round(date.getTime() / p) * p);
	}

	removeBooking(table_id: string, id: string) {
		if (this.isNewBooking())
			return;
		this.dataService.removeTableBooking(
			this.navService.locationId() as string,
			table_id,
			id).then(val => {
			this.notificationService.addNotification({
				type: "info",
				message: "Бронирование отменено",
				timeOut: 5000,
			});
		}).catch(e => {
			this.notificationService.addNotification({
				type: "error",
				message: e.error ? ( e.error.message ? e.statusText : e.statusText ) : e.statusText,
				timeOut: 5000,
			});
		});
	}


	editBooking(newObject: BookingCard, hours: string) {
		const foundIdx = this.bookData().findIndex(val => {
			return val.booking_id == newObject.booking_id;
		});
		console.log(foundIdx);

		if (foundIdx == -1) {
			let newBooking: CreateBookingAdmin = {
				features: newObject.features,
				time_start: this.toInputDate(newObject.date_start,
					newObject.time_start,
				) + ":00.000Z",
				hours: hours,
				comment: newObject.comment,
				people_amount: newObject.amount,
				phone_number: foundIdx == -1 ? this.telVal : null,
			};
			this.dataService.createTableBooking(this.navService.locationId() as string, newObject.table_id, newBooking).then(val => {
				this.removeLocal(newObject, foundIdx);
				console.log(val.users);
				newObject.booking_id = val.id;
				newObject.code = val.code;
				newObject.name = val.users[0].first_name;
				newObject.telegram_username = val.users[0].username;
				newObject.members = val.users;
				this.chosenBookId.set(val.id);

				this.updateLocal(newObject, foundIdx);
				this.notificationService.addNotification({
					type: "info",
					message: "Бронирование сохранено (код: " + val.code + ")",
					timeOut: 5000,
				});
				this.isNewBooking.set(false);

				this.setupInputData();
			}).catch(e => {
				console.log(e);
				this.notificationService.addNotification({
					type: "error",
					message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
					timeOut: 5000,
				});
			});
		}
		else {
			let newBooking: UpdateBooking = {
				features: newObject.features,
				time_start: this.toInputDate(newObject.date_start,
					newObject.time_start,
				) + ":00.000Z",
				hours: hours,
				comment: newObject.comment,
				people_amount: newObject.amount,
			};
			this.dataService.updateTableBooking(
				this.navService.locationId() as string,
				newObject.table_id,
				newObject.booking_id,
				newBooking,
			).then((val) => {
				this.notificationService.addNotification({
					type: "info",
					message: "Бронирование обновлено",
					timeOut: 5000,
				});

				this.updateLocal(newObject, foundIdx);
			}).catch(e => {
				this.notificationService.addNotification({
					type: "error",
					message: e.error ? ( e.error.message ? e.error.message : e.statusText ) : e.statusText,
					timeOut: 5000,
				});
			});
		}
	}


	removeLocal(newObject: BookingCard, foundIdx: number) {
		this.bookData.update(val => {
			if (foundIdx == -1)
				val.push(newObject);
			else
				val[foundIdx] = newObject;
			return val;
		});

		//@ts-ignore
		this.dataItems.remove({ id: newObject.booking_id });
	}

	updateLocal(newObject: BookingCard, foundIdx: number) {
		console.log(newObject);
		this.bookData.update(val => {
			if (foundIdx == -1)
				val.push(newObject);
			else
				val[foundIdx] = newObject;
			return val;
		});

		if (foundIdx != -1) {
			this.dataItems.update({
				id: newObject.booking_id,
				content: newObject.name,
				start: this.toNormalDate(newObject.date_start, newObject.time_start),
				end: this.toNormalDate(newObject.date_end, newObject.time_end),
				group: this.chosenBookData().table_id,
			});

			this.prevItem = {
				id: newObject.booking_id as string,
				start: this.toNormalDate(newObject.date_start, newObject.time_start),
				end: this.toNormalDate(newObject.date_end, newObject.time_end),
				group: this.chosenBookData().table_id,
			};
		}
		else {
			this.dataItems.add({
				id: newObject.booking_id,
				content: newObject.name,
				start: this.toNormalDate(newObject.date_start, newObject.time_start),
				end: this.toNormalDate(newObject.date_end, newObject.time_end),
				group: this.chosenBookData().table_id,
			});

			this.prevItem = {
				id: newObject.booking_id as string,
				start: this.toNormalDate(newObject.date_start, newObject.time_start),
				end: this.toNormalDate(newObject.date_end, newObject.time_end),
				group: this.chosenBookData().table_id,
			};

			//@ts-ignore
			this.timeline?.setSelection(newObject.booking_id);
			//@ts-ignore
			this.setInputsTime(this.dataItems.get(newObject.booking_id));
		}
	}

	deleteChosen() {
		this.removeBooking(this.chosenBookData().table_id, this.chosenBookId());
		this.dataItems.remove(this.chosenBookId());
		this.chosenBookId.set("");
	}

	getChosenTableId() {
		return this.dataItems.get(this.timeline!.getSelection()[0])!.group as string;
	}

	submit() {
		const item = this.dataItems.get(this.chosenBookId()) as TimelineItem;
		console.log(this.sTimeVal);
		let te = new Date(Date.parse(this.sTimeVal) + Number(this.eTimeVal) * 1000 * 3600 + 3 * 1000 * 3600).toISOString().slice(0, 16);
		console.log(te);
		this.editBooking({
			name: this.nameVal,
			time_start: this.sTimeVal.slice(11),
			time_end: te.slice(11),
			date_start: this.sTimeVal.split("T")[0].split("-")[2] + "." + this.sTimeVal.split("T")[0].split("-")[1],
			date_end: te.split("T")[0].split("-")[2] + "." + te.split("T")[0].split("-")[1],
			code: "",
			telegram_username: this.usernameVal,
			booking_id: this.chosenBookId(),
			table_id: this.getChosenTableId(),
			features: this.newFeatures(),
			comment: this.commentVal,
			amount: this.amountVal,
			members: this.chosenBookData().members,

		}, this.eTimeVal);

		console.log(this.tooltip);


	}

	toInputDate(date: string, time: string): string {
		return "2025-" + date.slice(3, 5)
			+ "-" + date.slice(0, 2)
			+ "T" + time.slice(0, 2)
			+ ":" + time.slice(3, 5);
	}


	toNormalDate(date: string, time: string): number {
		let res: string = this.toInputDate(date, time);
		return Date.parse(res);
	}

	normalToInputDate(date: string): string {
		let dates = date.split(".");
		let times = date.split(", ")[1].slice(0, 5);
		return dates[2].slice(0, 4) + "-"
			+ dates[1] + "-"
			+ dates[0] + "T" + times;

	}

	toDS(x: number): string {
		if (String(x).length == 1) {
			return "0" + String(x);
		}
		return String(x);
	}

	scrollDown() {
		if (!this.scroll()) {
			this.bcontainerRef.nativeElement.scrollIntoView({ behavior: "smooth" });
			this.scroll.set(true);
		}
		else {
			this.tcontainerRef.nativeElement.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
			this.scroll.set(false);
		}
	}


  remove(){
    let i = Number(this.eTimeVal)

    if(i < 2)
      return

    this.eTimeVal = String(i - 1)
	this.onChangeTime()
  }

  add(){
    let i = Number(this.eTimeVal)

    if(i > 11)
      return

    this.eTimeVal = String(i + 1)
	this.onChangeTime()
  }
}



