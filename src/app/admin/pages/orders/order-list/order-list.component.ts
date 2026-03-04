import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminOrderService, ProductStatistic } from '../../../../core/services/admin-order.service';
import { Order, OrderItem } from '../../../../core/models/order.model';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  orderItems: Map<number, OrderItem[]> = new Map();
  productStatistics: ProductStatistic[] = [];
  totalOrders: number = 0;
  totalRevenue: number = 0;
  isLoadingOrders: boolean = false;
  isLoadingStats: boolean = false;

  constructor(
    private adminOrderService: AdminOrderService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStatistics();
  }

  loadOrders(): void {
    this.isLoadingOrders = true;
    this.adminOrderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => 
          (b.idOrder || 0) - (a.idOrder || 0)
        );
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Load items for each order
        this.orders.forEach(order => {
          if (order.idOrder) {
            this.loadOrderItems(order.idOrder);
          }
        });
        
        this.isLoadingOrders = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load orders', 'Error');
        this.isLoadingOrders = false;
      }
    });
  }

  loadOrderItems(orderId: number): void {
    this.adminOrderService.getOrderItemsByOrderId(orderId).subscribe({
      next: (items) => {
        this.orderItems.set(orderId, items);
      },
      error: (err) => {
        console.error(`Failed to load items for order ${orderId}`, err);
      }
    });
  }

  loadStatistics(): void {
    this.isLoadingStats = true;
    this.adminOrderService.getAllOrderItems().subscribe({
      next: (allItems) => {
        const productMap = new Map<number, ProductStatistic>();

        allItems.forEach(item => {
          const productId = item.product?.idProduct || 0;
          const formationTitle = item.formationTitleSnapshot || 'Unknown';
          const quantity = item.quantity || 0;
          const revenue = item.unitPriceSnapshot * quantity;

          if (productMap.has(productId)) {
            const stat = productMap.get(productId)!;
            stat.orderCount++;
            stat.totalQuantity += quantity;
            stat.totalRevenue += revenue;
          } else {
            productMap.set(productId, {
              formationTitle,
              productId,
              orderCount: 1,
              totalQuantity: quantity,
              totalRevenue: revenue
            });
          }
        });

        this.productStatistics = Array.from(productMap.values())
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 5);
        
        this.isLoadingStats = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load statistics', 'Error');
        this.isLoadingStats = false;
      }
    });
  }

  getOrderItems(orderId: number | undefined): OrderItem[] {
    if (!orderId) return [];
    return this.orderItems.get(orderId) || [];
  }

  /** Max order count among top products (for progress bar). */
  get maxOrderCount(): number {
    if (!this.productStatistics.length) return 1;
    return Math.max(...this.productStatistics.map(s => s.orderCount), 1);
  }

  deleteOrder(orderId: number | undefined): void {
    if (!orderId) return;
    
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      this.adminOrderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.toastr.success('Order deleted successfully', 'Success');
          this.loadOrders();
          this.loadStatistics();
        },
        error: (err) => {
          this.toastr.error('Failed to delete order', 'Error');
        }
      });
    }
  }

  downloadOrderPDF(order: Order): void {
    if (!order.idOrder) return;

    const items = this.getOrderItems(order.idOrder);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(76, 175, 80);
    doc.text('ForMe Training', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Order Invoice', 14, 30);
    
    // Order details
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.idOrder}`, 14, 40);
    doc.text(`Date: ${new Date(order.createdAt || '').toLocaleDateString()}`, 14, 46);
    doc.text(`Status: ${order.status}`, 14, 52);
    doc.text(`User ID: ${order.userId}`, 14, 58);
    
    // Items table
    const tableData = items.map(item => [
      item.formationTitleSnapshot,
      item.quantity.toString(),
      `${item.unitPriceSnapshot.toFixed(2)} TND`,
      `${(item.quantity * item.unitPriceSnapshot).toFixed(2)} TND`
    ]);
    
    autoTable(doc, {
      startY: 65,
      head: [['Formation', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [76, 175, 80] },
      foot: [[
        { content: 'Total Amount', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `${order.totalAmount.toFixed(2)} ${order.currency}`, styles: { fontStyle: 'bold' } }
      ]],
      footStyles: { fillColor: [240, 240, 240] }
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', 14, finalY + 15);
    doc.text('ForMe Training & Certification Platform', 14, finalY + 20);
    
    // Save
    doc.save(`Order_${order.idOrder}_Invoice.pdf`);
    this.toastr.success('PDF downloaded successfully', 'Success');
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-success';
      case 'PENDING':
        return 'bg-warning';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
