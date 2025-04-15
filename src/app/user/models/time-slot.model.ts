export interface TimeIntervalModel {
	start: TimeSlotModel;
	hoursCount: number;
}

export interface TimeSlotModel {
	date: string;
	time: string;
}