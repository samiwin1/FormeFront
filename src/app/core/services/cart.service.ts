import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { Cart, CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.shopApiUrl}/cart`;
  private cartItemUrl = `${environment.shopApiUrl}/cartItem`;
  
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getActiveCartByUser(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/getActiveCartByUser/${userId}`);
  }

  addCart(cart: any): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/addCart`, cart);
  }

  updateCart(id: number, cart: any): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/updateCart/${id}`, cart);
  }

  addCartItem(cartItem: any): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.cartItemUrl}/addCartItem`, cartItem);
  }

  deleteCartItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.cartItemUrl}/deleteCartItem/${id}`);
  }

  getCartItemsByCartId(cartId: number): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.cartItemUrl}/getByCartId/${cartId}`);
  }

  getCartItemByCartIdAndProductId(cartId: number, productId: number): Observable<CartItem> {
    return this.http.get<CartItem>(`${this.cartItemUrl}/getByCartIdAndProductId/${cartId}/${productId}`);
  }

  updateCartCount(count: number): void {
    this.cartCountSubject.next(count);
  }

  refreshCartCount(userId: number): void {
    this.getActiveCartByUser(userId).subscribe({
      next: (cart) => {
        if (cart && cart.idCart) {
          this.getCartItemsByCartId(cart.idCart).subscribe({
            next: (items) => this.updateCartCount(items.length),
            error: () => this.updateCartCount(0)
          });
        } else {
          this.updateCartCount(0);
        }
      },
      error: () => this.updateCartCount(0)
    });
  }
}
