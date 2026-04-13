// partner-feedbacks.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-feedbacks',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './partner-feedbacks.component.html'
})
export class PartnerFeedbacksComponent {
  feedbackForm: FormGroup;
  submitted = false;
  success = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.feedbackForm = this.fb.group({
      partnerEmail: ['', [Validators.required, Validators.email]],
      title: ['', Validators.required],
      comment: ['', [Validators.required, Validators.minLength(10)]],
      category: ['OVERALL', Validators.required],
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  submit() {
    if (this.feedbackForm.invalid) return;
    this.http.post('http://localhost:8080/api/feedbacks', this.feedbackForm.value)
      .subscribe({ next: () => this.success = true, error: () => alert('Error submitting') });
  }
}