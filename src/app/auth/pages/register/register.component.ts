import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationsService } from "../../../core/services/notifications.service";
import { UserService } from "../../services/user.service";

@Component({
    selector: 'app-register',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        RouterLink,
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
})
export default class RegisterComponent {
    @ViewChild('passwordContainer') passwordContainer!: ElementRef<HTMLInputElement>;

    password: string = '';
    username: string = '';

    constructor(
        private router: Router,
        private userService: UserService,
        private notification: NotificationsService,
    ) {}

    showPassword() {
        if (this.passwordContainer.nativeElement.type === 'text')
            this.passwordContainer.nativeElement.type = 'password';
        else
            this.passwordContainer.nativeElement.type = 'text';
    }

    register() {
        this.userService.register({
            login: this.username,
            password: this.password
        }).then(() => {
            this.router.navigate(['/admin']).then();
        }).catch(e => {
            this.notification.addNotification({
                message: e.error.message, timeOut: 5000, type: 'error'
            })
        })
    }
}
