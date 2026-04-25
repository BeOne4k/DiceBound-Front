import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  
})
export class LoginComponent {

  email = '';
  password = '';


    signup() {
      const dto = {
        username: this.name,
        email: this.signupEmail,
        password: this.signupPassword
      };

      this.authService.register(dto).subscribe({
        next: (res) => {
          console.log(' REGISTER SUCCESS:', res);

          // можно сразу переключить на логин
          this.setTab('login');

          // очистка формы
          this.name = '';
          this.signupEmail = '';
          this.signupPassword = '';
        },
        error: (err) => {
          console.error(' REGISTER ERROR:', err);
        }
      });
    }

  constructor(
  private authService: AuthService,
  private router: Router
) {}

login() {
  const dto = {
    email: this.email,
    password: this.password
  };

  this.authService.login(dto).subscribe({
    next: (res) => {
      console.log('✅ LOGIN SUCCESS:', res);

      if (res?.token) {
        this.authService.saveToken(res.token);

        this.router.navigate(['/characters']);
      }
    },

    error: (err) => {
      console.error(' LOGIN ERROR:', err);

      this.inputError = true;
      this.showError('Invalid credentials');

      setTimeout(() => {
        this.inputError = false;
      }, 5000);
    }
  });
}

  activeTab: 'login' | 'signup' = 'login';

  // signup
  name = '';
  signupEmail = '';
  signupPassword = '';

  setTab(tab: 'login' | 'signup') {
    this.activeTab = tab;
  }

errorMessage: string | null = null;
toastHidden = false;

showError(msg: string) {
  this.toastHidden = false;
  this.errorMessage = msg;

  setTimeout(() => {
    this.toastHidden = true;

    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }, 5000);
}

inputError = false;

}