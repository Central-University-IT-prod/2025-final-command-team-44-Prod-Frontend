import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { BehaviorSubject, filter, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SideBarInteractionService implements OnDestroy {

    state = new BehaviorSubject<boolean>(window.innerWidth > 1000);

    private routerSubscription: Subscription;

    constructor(
        private router: Router,
    ) {
        this.routerSubscription = this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe((ev: RouterEvent) => {
                this.close();
            });
    }

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
    }

    open() {
        this.state.next(true);
    }

    close() {
        this.state.next(false);
    }
}
