import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { FormationService } from '../../../../core/services/formation.service';
import { Formation } from '../../../../core/models/formation.model';
import { Product } from '../../../../core/models/product.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css']
})
export class ProductCreateComponent implements OnInit {
  formations: Formation[] = [];
  selectedFormationId: number | null = null;
  price: number = 0;
  currency: string = 'TND';
  isAvailable: boolean = true;
  isEditMode: boolean = false;
  productId: number | null = null;

  constructor(
    private productService: ProductService,
    private formationService: FormationService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadFormations();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }

  loadFormations(): void {
    this.formationService.listFormations().subscribe({
      next: (data) => this.formations = data,
      error: (err) => this.toastr.error('Failed to load formations', 'Error')
    });
  }

  loadProduct(id: number): void {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.selectedFormationId = product.formation?.id || null;
        this.price = product.price;
        this.currency = product.currency;
        this.isAvailable = product.isAvailable || false;
      },
      error: (err) => this.toastr.error('Failed to load product', 'Error')
    });
  }

  onSubmit(): void {
    if (!this.selectedFormationId) {
      this.toastr.warning('Please select a formation', 'Warning');
      return;
    }

    const productData = {
      formation: { id: this.selectedFormationId },
      price: this.price,
      currency: this.currency,
      isAvailable: this.isAvailable
    };

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData).subscribe({
        next: () => {
          this.toastr.success('Product updated successfully', 'Success');
          this.router.navigate(['/admin/products/list']);
        },
        error: (err) => this.toastr.error('Failed to update product', 'Error')
      });
    } else {
      this.productService.addProduct(productData).subscribe({
        next: () => {
          this.toastr.success('Product created successfully', 'Success');
          this.router.navigate(['/admin/products/list']);
        },
        error: (err) => this.toastr.error('Failed to create product', 'Error')
      });
    }
  }
}
