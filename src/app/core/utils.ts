import { NotificationsService } from "./services/notifications.service";

/** Converts date to string (DD.MM) */
export function convertDateToString(date: Date): string {
	return `${ String(date.getDate()).padStart(2, "0") }.${ String(date.getMonth() + 1).padStart(2, "0") }`;
}

export function addMonthNameToDateString(date: string) {
	const [day, month] = date.split(".");
	const months = [
		"января",
		"февраля",
		"марта",
		"апреля",
		"мая",
		"июня",
		"июля",
		"августа",
		"сентября",
		"октября",
		"ноября",
		"декабря",
	];
	return `${ Number(day) } ${ months[Number(month) - 1] }`;
}

/** Converts date to string HH:MM */
export function convertDateToHoursString(date: Date): string {
	return `${ String(date.getHours()).padStart(2, "0") }:${ String(date.getMinutes()).padStart(2, "0") }`;
}


export function parseTableName(name: string): string {
	if (name.includes("table"))
		return "Стол " + name.split("table")[1];
	else
		return "Комната " + name.split("room")[1];
}

export const copyToClipboard = async (link: string, notificationService: NotificationsService) => {
	try {
		if (!navigator.clipboard) {
			notificationService.addNotification({
				message: 'Браузер не поддерживает копирование', timeOut: 5000, type: 'error',
			});
			return;
		}

		await navigator.clipboard.writeText(link);
		notificationService.addNotification({
			message: 'Ссылка успешно скопирована', timeOut: 5000, type: 'info',
		});
	} catch (error) {
		console.log(error);
	}
};

var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e: any) {
	e.preventDefault();
}

function preventDefaultForScrollKeys(e: KeyboardEvent) {
	//@ts-ignore
	if (keys[e.keyCode]) {
		preventDefault(e);
		return false;
	}
	return true;
}

var supportsPassive = false;
try {
	//@ts-ignore
	window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
		get: function () { supportsPassive = true; }
	}));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

export function disableScroll(element: HTMLDivElement) {
	element.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
	element.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
	element.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
	element.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
export function enableScroll(element: HTMLDivElement) {
	element.removeEventListener('DOMMouseScroll', preventDefault, false);
	//@ts-ignore
	element.removeEventListener(wheelEvent, preventDefault, wheelOpt);
	//@ts-ignore
	element.removeEventListener('touchmove', preventDefault, wheelOpt);
	element.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}