import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { Product } from '../../../../core/models/product.model';
import { ToastrService } from 'ngx-toastr';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  products: Product[] = [];
  userId: number | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getUserId();
    this.loadProducts();
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

  loadProducts(): void {
    this.productService.listProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: (err) => this.toastr.error('Failed to load courses', 'Error')
    });
  }

  addToCart(product: Product): void {
    if (!this.userId) {
      this.toastr.warning('Please login to add items to cart', 'Warning');
      this.router.navigate(['/login']);
      return;
    }

    if (!product.idProduct || !product.formation?.id) {
      this.toastr.error('Invalid product data', 'Error');
      return;
    }

    this.cartService.getActiveCartByUser(this.userId).subscribe({
      next: (cart) => {
        const cartId = cart?.idCart;
        
        if (!cartId) {
          this.cartService.addCart({ userId: this.userId, status: 'ACTIVE' }).subscribe({
            next: (newCart) => {
              this.addItemToCart(newCart.idCart!, product);
            },
            error: (err) => this.toastr.error('Failed to create cart', 'Error')
          });
        } else {
          this.checkAndAddItem(cartId, product);
        }
      },
      error: (err) => {
        this.cartService.addCart({ userId: this.userId, status: 'ACTIVE' }).subscribe({
          next: (newCart) => {
            this.addItemToCart(newCart.idCart!, product);
          },
          error: (err) => this.toastr.error('Failed to create cart', 'Error')
        });
      }
    });
  }

  checkAndAddItem(cartId: number, product: Product): void {
    this.cartService.getCartItemByCartIdAndProductId(cartId, product.idProduct!).subscribe({
      next: (existingItem) => {
        if (existingItem) {
          this.toastr.warning('Product already in cart', 'Warning');
        } else {
          this.addItemToCart(cartId, product);
        }
      },
      error: (err) => {
        this.addItemToCart(cartId, product);
      }
    });
  }

  addItemToCart(cartId: number, product: Product): void {
    const cartItem = {
      cart: { idCart: cartId },
      product: { idProduct: product.idProduct! },
      formation: { id: product.formation!.id! },
      quantity: 1,
      unitPriceSnapshot: product.price,
      formationTitleSnapshot: product.formation!.title || 'Unknown'
    };

    this.cartService.addCartItem(cartItem).subscribe({
      next: () => {
        this.toastr.success('Product added to cart', 'Success');
        this.cartService.refreshCartCount(this.userId!);
      },
      error: (err) => this.toastr.error('Failed to add product to cart', 'Error')
    });
  }

  buyNow(product: Product): void {
    if (!this.userId) {
      this.toastr.warning('Please login to purchase', 'Warning');
      this.router.navigate(['/login']);
      return;
    }

    if (!product.idProduct || !product.formation?.id) {
      this.toastr.error('Invalid product data', 'Error');
      return;
    }

    this.cartService.getActiveCartByUser(this.userId).subscribe({
      next: (cart) => {
        const cartId = cart?.idCart;
        
        if (!cartId) {
          this.cartService.addCart({ userId: this.userId, status: 'ACTIVE' }).subscribe({
            next: (newCart) => {
              this.addItemAndCheckout(newCart.idCart!, product);
            },
            error: (err) => this.toastr.error('Failed to create cart', 'Error')
          });
        } else {
          this.checkItemAndCheckout(cartId, product);
        }
      },
      error: (err) => {
        this.cartService.addCart({ userId: this.userId, status: 'ACTIVE' }).subscribe({
          next: (newCart) => {
            this.addItemAndCheckout(newCart.idCart!, product);
          },
          error: (err) => this.toastr.error('Failed to create cart', 'Error')
        });
      }
    });
  }

  checkItemAndCheckout(cartId: number, product: Product): void {
    this.cartService.getCartItemByCartIdAndProductId(cartId, product.idProduct!).subscribe({
      next: (existingItem) => {
        if (existingItem) {
          this.proceedToCheckout();
        } else {
          this.addItemAndCheckout(cartId, product);
        }
      },
      error: (err) => {
        this.addItemAndCheckout(cartId, product);
      }
    });
  }

  addItemAndCheckout(cartId: number, product: Product): void {
    const cartItem = {
      cart: { idCart: cartId },
      product: { idProduct: product.idProduct! },
      formation: { id: product.formation!.id! },
      quantity: 1,
      unitPriceSnapshot: product.price,
      formationTitleSnapshot: product.formation!.title || 'Unknown'
    };

    this.cartService.addCartItem(cartItem).subscribe({
      next: () => {
        this.proceedToCheckout();
      },
      error: (err) => this.toastr.error('Failed to add product to cart', 'Error')
    });
  }

  proceedToCheckout(): void {
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
