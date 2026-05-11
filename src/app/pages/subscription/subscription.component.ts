import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class SubscriptionComponent {

  cardNumber = '';
  expiry = '';
  cvv = '';
  cardName = '';

  errors: { [key: string]: string } = {};
  loading = false;
  success = false;

  constructor(private router: Router) {}

  // ── FORMATTERS ────────────────────────────────────

  formatCardNumber(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    this.cardNumber = val;
    input.value = val;
  }

  formatExpiry(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    this.expiry = val;
    input.value = val;
  }

  formatCvv(e: Event): void {
    const input = e.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(0, 3);
    this.cvv = val;
    input.value = val;
  }

  // ── VALIDATION ────────────────────────────────────

  private validate(): boolean {
    this.errors = {};

    // Card number: 16 digits
    const digits = this.cardNumber.replace(/\s/g, '');
    if (digits.length !== 16) {
      this.errors['card'] = 'Card number must be 16 digits';
    }

    // Expiry: not expired
    const expiryMatch = this.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      this.errors['expiry'] = 'Enter expiration date as MM/YY';
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = parseInt('20' + expiryMatch[2], 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (month < 1 || month > 12) {
        this.errors['expiry'] = 'Invalid month';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        this.errors['expiry'] = 'Card has expired';
      }
    }

    // CVV: 3 digits
    if (this.cvv.length !== 3) {
      this.errors['cvv'] = 'CVV must be 3 digits';
    }

    // Cardholder name
    if (!this.cardName.trim() || this.cardName.trim().length < 2) {
      this.errors['name'] = 'Enter cardholder name';
    }

    return Object.keys(this.errors).length === 0;
  }

  // ── SUBMIT ────────────────────────────────────────

  subscribe(): void {
    if (!this.validate()) return;

    this.loading = true;

    // Фиктивная оплата — просто имитируем задержку
    setTimeout(() => {
      this.loading = false;
      this.success = true;

      // Сохраняем статус подписки в localStorage
      const subscriptionData = {
        active: true,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      localStorage.setItem('dicebound_subscription', JSON.stringify(subscriptionData));

      // Через 2 сек редирект обратно на создание персонажа
      setTimeout(() => {
        this.router.navigate(['/characters/create']);
      }, 2000);
    }, 1200);
  }

  goBack(): void {
    this.router.navigate(['/characters']);
  }
}
