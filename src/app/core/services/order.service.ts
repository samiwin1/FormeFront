import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Order, OrderItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.shopApiUrl}/order`;
  private orderItemUrl = `${environment.shopApiUrl}/orderItem`;

  constructor(private http: HttpClient) {}

  checkout(userId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/checkout/${userId}`, {});
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/getOrder/${orderId}`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/updateOrderStatus/${orderId}`, { status });
  }

  getOrderItemsByOrderId(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.orderItemUrl}/getByOrderId/${orderId}`);
  }
}
