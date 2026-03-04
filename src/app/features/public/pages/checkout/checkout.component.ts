import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  clientSecret: string = '';
  orderId: number | null = null;
  isProcessing: boolean = false;
  stripeReady: boolean = false;

  private stripePublicKey = 'pk_test_51QxSSXChmhEZInbmW8zEHsoc7tbqeDnZs8sZMx2SgHUKOdhFhBxOBBWnaN4iLoZyBDmao6objazdCSqEQ2tgO7Ay00qOYahLwC';

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private ngZone: NgZone
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    this.clientSecret = state['clientSecret'] || '';
    this.orderId = state['orderId'] || null;
  }

  async ngOnInit(): Promise<void> {
    if (!this.clientSecret || !this.orderId) {
      this.toastr.error('Invalid checkout session', 'Error');
      this.router.navigate(['/cart']);
      return;
    }

    await this.initializeStripe();
  }

  async initializeStripe(): Promise<void> {
    try {
      this.stripe = await loadStripe(this.stripePublicKey);
      
      if (!this.stripe) {
        this.toastr.error('Failed to load Stripe', 'Error');
        return;
      }

      this.elements = this.stripe.elements({
        clientSecret: this.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#4CAF50',
          }
        }
      });

      const paymentElement = this.elements.create('payment');
      
      // Wait for Angular to render the DOM
      setTimeout(() => {
        const paymentElementContainer = document.querySelector('#payment-element');
        
        if (!paymentElementContainer) {
          console.error('Payment element container not found in DOM');
          this.toastr.error('Payment form container not found', 'Error');
          return;
        }

        paymentElement.on('ready', () => {
          this.ngZone.run(() => {
            this.stripeReady = true;
            console.log('Stripe Payment Element is ready');
            
            // Force resize events to ensure proper rendering
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 1500);
          });
        });

        paymentElement.on('loaderror', (event) => {
          this.ngZone.run(() => {
            console.error('Stripe element load error:', event);
            this.toastr.error('Failed to load payment form', 'Error');
          });
        });

        // Mount the element
        try {
          paymentElement.mount('#payment-element');
          console.log('Payment element mounted successfully');
        } catch (mountError) {
          console.error('Error mounting payment element:', mountError);
          this.toastr.error('Failed to initialize payment form', 'Error');
        }
      }, 1000); // Increased timeout to ensure DOM is ready

    } catch (error) {
      console.error('Stripe initialization error:', error);
      this.toastr.error('Failed to initialize payment', 'Error');
    }
  }

  async handlePayment(): Promise<void> {
    if (!this.stripe || !this.elements || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmation/${this.orderId}`,
        },
      });

      if (error) {
        this.toastr.error(error.message || 'Payment failed', 'Error');
        this.isProcessing = false;
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.toastr.error('Payment processing failed', 'Error');
      this.isProcessing = false;
    }
  }
}
