import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AdminOrderService } from '../../services/admin-order.service';
import { Order, OrderItem } from '../../models/shop.models';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css',
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private adminOrderService = inject(AdminOrderService);
  private cartService = inject(CartService);

  order: Order | null = null;
  items: OrderItem[] = [];
  loading = true;
  error: string | null = null;
  confirmed = false;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    const id = orderId ? +orderId : null;
    if (id == null || isNaN(id)) {
      this.error = 'Invalid order.';
      this.loading = false;
      return;
    }
    this.orderService.updateOrderStatus(id, 'COMPLETED').subscribe({
      next: () => {
        this.confirmed = true;
        this.orderService.getOrder(id).subscribe({
          next: (order) => {
            this.order = order;
            this.adminOrderService.getOrderItemsByOrderId(id).subscribe({
              next: (list) => {
                this.items = list ?? [];
                if (order.userId != null) {
                  this.cartService.getActiveCartByUser(order.userId).subscribe({
                    next: (cart) => {
                      if (cart?.idCart != null) {
                        this.cartService.updateCart({ ...cart, status: 'COMPLETED' }).subscribe({
                          next: () => {
                            this.loading = false;
                          },
                          error: () => {
                            this.loading = false;
                          },
                        });
                      } else {
                        this.loading = false;
                      }
                    },
                    error: () => {
                      this.loading = false;
                    },
                  });
                  return;
                }
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              },
            });
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to confirm order.';
        this.loading = false;
      },
    });
  }
}
