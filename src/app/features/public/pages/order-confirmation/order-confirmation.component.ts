import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderItem } from '../../../../core/models/order.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;
  orderItems: OrderItem[] = [];
  orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['orderId'];
      if (this.orderId) {
        this.updateOrderStatusToCompleted();
      } else {
        this.toastr.error('Invalid order ID', 'Error');
        this.router.navigate(['/courses']);
      }
    });
  }

  updateOrderStatusToCompleted(): void {
    // Update order status to COMPLETED since payment was successful
    this.orderService.updateOrderStatus(this.orderId!, 'COMPLETED').subscribe({
      next: (updatedOrder) => {
        // Use the updated order from response so status is COMPLETED
        this.order = updatedOrder;
        this.loadOrderItems();
      },
      error: (err) => {
        console.error('Failed to update order status:', err);
        this.toastr.warning(
          'Order status could not be updated in the backend. Add the updateOrderStatus endpoint so the dashboard shows COMPLETED.',
          'Backend update failed'
        );
        // Still load order; confirmation page will show COMPLETED for display
        this.loadOrder();
      }
    });
  }

  /** Status to show on confirmation: always COMPLETED here since payment succeeded. */
  get displayStatus(): string {
    if (!this.order) return '';
    return this.order.status === 'PENDING' ? 'COMPLETED' : this.order.status;
  }

  loadOrder(): void {
    this.orderService.getOrder(this.orderId!).subscribe({
      next: (order) => {
        this.order = order;
        this.loadOrderItems();
      },
      error: (err) => {
        this.toastr.error('Failed to load order details', 'Error');
        this.router.navigate(['/courses']);
      }
    });
  }

  loadOrderItems(): void {
    this.orderService.getOrderItemsByOrderId(this.orderId!).subscribe({
      next: (items) => {
        this.orderItems = items;
      },
      error: (err) => this.toastr.error('Failed to load order items', 'Error')
    });
  }
}
