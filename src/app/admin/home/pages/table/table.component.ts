import { Component, signal } from '@angular/core';
import { NavbarService } from '../../services/navbar.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../../../../core/services/data.service';
import { BookingAdminResponse, BookingResponse, TablePatch, TableResponse, UserBookingForAdmin } from '../../../../../generated';
import { FormsModule } from '@angular/forms';
import { BookingCard } from '../../interfaces/booking-card';
import { NotificationsService } from '../../../../core/services/notifications.service';

@Component({
  selector: 'app-table',
  imports: [FormsModule, RouterLink],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export default class TableComponent {
  
  constructor(public navService : NavbarService,
    private route : ActivatedRoute,
    private dataService : DataService,
    private router : Router,
    private notificationService : NotificationsService
  ){
    this.setUpTable()
  }

  nameVal : string = ""

  capacityVal : string = ""

  curTable = signal<TableResponse | null>(null)

  newFeature = signal<boolean>(false)

  featureVal : string = ""

  bookingsList = signal<BookingCard[]>([])

  table_id : string | null = null;

  
    findCreator(users : UserBookingForAdmin[]){
      return users.find(el => {
        return el.status === "creator"
      })
    }

    parse(res : BookingAdminResponse[]) : BookingCard[]{
      let toReturn : BookingCard[] = []
      res.forEach(el => {
        let creator = this.findCreator(el.users);
        toReturn.push({
          name:creator?.first_name,
          telegram_username:creator?.username,
          time_start: el.time_start.slice(11, 16),
          time_end: el.time_end.slice(11, 16),
          date_start: el.time_start.split('T')[0].split('-')[2] + '.' + el.time_start.split('T')[0].split('-')[1],
          date_end: el.time_end.split('T')[0].split('-')[2] + '.' + el.time_end.split('T')[0].split('-')[1],
          booking_id:el.id,
          code:el.code,
          features:el.features, 
          comment:el.comment,
          amount:el.people_amount,
          members:el.users,
          table_id:el.table_id
        })
      })
      return toReturn;
    }
 
	async setUpTable() {
		const id = this.route.snapshot.paramMap.get("id");
		this.navService.locationId.set(id);
		if (id === null){
      this.router.navigate(['/'])
      return
    }
		this.table_id = this.route.snapshot.paramMap.get("table_id");
    if(!this.table_id){
      return;
    }

    this.dataService.getTableById(id, this.table_id).then(val => {
      this.curTable.set(val)
      this.dataService.getBookingsByTable(id, this.table_id as string).then(val2 => {
        this.bookingsList.set(this.parse(val2))
      }).catch(e => {
        this.notificationService.addNotification({
          type: "error",
          message:e.error ? (e.error.message ? e.error.message : e.statusText) : e.statusText,
          timeOut:5000
        })})
      this.setupInputs()
    }).catch(e => {
      this.notificationService.addNotification({
        type: "error",
        message:e.error ? (e.error.message ? e.error.message : e.statusText) : e.statusText,
        timeOut:5000
      })})

    //this.bookingsList.set(this.dataService.getBookingsForTable())
    this.bookingsList.set([])

    this.sortBookings()

	}

  setupInputs(){
    this.nameVal = this.curTable()?.table_name
    this.capacityVal = this.curTable()?.max_people_amount
  }

  addFeature(){
    if(this.featureVal){
      this.curTable.update(val => {
        val!.features.push(this.featureVal)
        return val;
      })
    }

    this.featureVal = ""

    this.newFeature.set(false)
  }

  removeFeature(idx : number){

      this.curTable.update(val => {
        val!.features.splice(idx, 1)
        return val;
      })
  }

  sortBookings(){
    this.bookingsList.update(val => {
      return val.sort((a : BookingCard, b : BookingCard) => {
        let da : number = this.toNormalDate(a.date_start, a.time_start);
        let db : number = this.toNormalDate(b.date_start, b.time_start);

        if(da < db)
          return -1;
        else return 1
      });
    })
  }

  submit(){
    let toPut : TablePatch = {
      max_people_amount: this.capacityVal,
      features: this.curTable()?.features,
    }

    

    this.dataService.updateTable(this.navService.locationId() as string, this.table_id as string, toPut).then(val => {
      this.notificationService.addNotification({
        type: "info",
        message:"Место обновлено",
        timeOut:5000
      })
    }).catch(e => {
      this.notificationService.addNotification({
        type: "error",
        message:e.error ? (e.error.message ? e.error.message : e.statusText) : e.statusText,
        timeOut:5000
      })
    })

    //put table

    
  }


  toInputDate(date : string, time : string) : string{
    return "2025-" + date.slice(3, 5)
    + '-' + date.slice(0, 2)
    + 'T' + time.slice(0, 2)
    + ':' + time.slice(3, 5)
  }
  
  toNormalDate(date : string, time : string) : number{
    let res : string = this.toInputDate(date, time)
    return Date.parse(res);
  }

}
