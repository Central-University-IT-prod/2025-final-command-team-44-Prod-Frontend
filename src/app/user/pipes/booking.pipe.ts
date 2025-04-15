import { Pipe, PipeTransform } from "@angular/core";
import { BookingResponse, MyGroupResponse } from "../../../generated";

@Pipe({
	name: "bookingPipe",
})
export class BookingPipe implements PipeTransform {

	transform(value: MyGroupResponse[], args: "all" | "table" | "room" | "queue"): any {
		if (!value) return [];
		if (!args) return value;
		if (args === 'all') return value;

		return value.filter(function (item) {
			return item.table_name.includes(args);
		});
	}

}