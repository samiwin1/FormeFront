import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { Cart, CartItem } from '../../../../core/models/cart.model';
import { ToastrService } from 'ngx-toastr';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  cartItems: CartItem[] = [];
  userId: number | null = null;
  total: number = 0;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getUserId();
    if (this.userId) {
      this.loadCart();
    } else {
      this.toastr.warning('Please login to view cart', 'Warning');
      this.router.navigate(['/login']);
    }
  }

  getUserId(): void {
    const token = localStorage.getItem('forme_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.userId = decoded.uid;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }

  loadCart(): void {
    this.cartService.getActiveCartByUser(this.userId!).subscribe({
      next: (cart) => {
        this.cart = cart;
        if (cart && cart.idCart) {
          this.loadCartItems(cart.idCart);
        }
      },
      error: (err) => {
        console.error('Error loading cart:', err);
      }
    });
  }

  loadCartItems(cartId: number): void {
    this.cartService.getCartItemsByCartId(cartId).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.calculateTotal();
      },
      error: (err) => this.toastr.error('Failed to load cart items', 'Error')
    });
  }

  calculateTotal(): void {
    this.total = this.cartItems.reduce((sum, item) => 
      sum + (item.unitPriceSnapshot * item.quantity), 0
    );
  }

  removeItem(itemId: number | undefined): void {
    if (itemId && confirm('Remove this item from cart?')) {
      this.cartService.deleteCartItem(itemId).subscribe({
        next: () => {
          this.toastr.success('Item removed from cart', 'Success');
          this.loadCart();
          this.cartService.refreshCartCount(this.userId!);
        },
        error: (err) => this.toastr.error('Failed to remove item', 'Error')
      });
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Your cart is empty', 'Warning');
      return;
    }

    this.orderService.checkout(this.userId!).subscribe({
      next: (order) => {
        this.paymentService.createPaymentIntent(order.idOrder!).subscribe({
          next: (paymentData) => {
            this.router.navigate(['/checkout'], {
              state: { clientSecret: paymentData.clientSecret, orderId: order.idOrder }
            });
          },
          error: (err) => this.toastr.error('Failed to create payment intent', 'Error')
        });
      },
      error: (err) => this.toastr.error('Failed to create order', 'Error')
    });
  }
}
