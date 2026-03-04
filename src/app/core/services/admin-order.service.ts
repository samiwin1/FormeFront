import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Order, OrderItem } from '../models/order.model';

export interface ProductStatistic {
  formationTitle: string;
  productId: number;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private apiUrl = `${environment.shopApiUrl}/order`;
  private orderItemUrl = `${environment.shopApiUrl}/orderItem`;

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/listOrders`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/getOrder/${orderId}`);
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteOrder/${orderId}`);
  }

  getOrderItemsByOrderId(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.orderItemUrl}/getByOrderId/${orderId}`);
  }

  // Get all order items for statistics
  getAllOrderItems(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.orderItemUrl}/listOrderItems`);
  }
}
