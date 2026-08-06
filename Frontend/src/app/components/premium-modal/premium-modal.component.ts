import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PremiumService } from '../../services/premium.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-premium-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './premium-modal.component.html',
  styleUrls: ['./premium-modal.component.css'],
})
export class PremiumModalComponent {
  @Input() show = false;
  @Output() showChange = new EventEmitter<boolean>();
  @Output() upgraded = new EventEmitter<void>();

  step: 'plans' | 'payment' = 'plans';
  selectedPlan: 'monthly' | 'yearly' = 'monthly';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';
  processing = false;

  constructor(private premiumService: PremiumService, private alert: AlertService) {}

  get planPrice(): string {
    return this.selectedPlan === 'yearly' ? '$49.990/año' : '$5.990/mes';
  }

  selectPlan(plan: 'monthly' | 'yearly'): void {
    this.selectedPlan = plan;
  }

  goToPayment(): void {
    this.step = 'payment';
  }

  backToPlans(): void {
    this.step = 'plans';
  }

  formatCard(input: string): void {
    this.cardNumber = input.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  }

  formatExpiry(input: string): void {
    let val = input.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
    this.cardExpiry = val.slice(0, 5);
  }

  close(): void {
    this.show = false;
    this.showChange.emit(false);
    this.step = 'plans';
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
  }

  processPayment(): void {
    if (!this.cardNumber || !this.cardName || !this.cardExpiry || !this.cardCvv) {
      this.alert.warning('Datos incompletos', 'Completa todos los campos de la tarjeta.');
      return;
    }
    this.processing = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id;
    if (!userId) { this.processing = false; return; }

    setTimeout(() => {
      this.premiumService.upgradeToPremium(userId).subscribe({
        next: () => {
          user.plan = 'premium';
          localStorage.setItem('user', JSON.stringify(user));
          this.processing = false;
          this.alert.success('¡Premium activado!', 'Disfruta de Auralis sin anuncios y con beneficios exclusivos.');
          this.close();
          this.upgraded.emit();
        },
        error: () => {
          this.processing = false;
          this.alert.error('Error', 'No se pudo procesar el pago. Intenta de nuevo.');
        }
      });
    }, 1500);
  }
}
