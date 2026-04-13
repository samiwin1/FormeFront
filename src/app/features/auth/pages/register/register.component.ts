import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

type Profession = 'STUDENT' | 'DEVELOPER' | 'OTHER' | 'UNKNOWN'| 'EVALUATOR';


@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['../../../../auth.styles.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  showPassword = false;

  // ✅ choices from backend enum (NO ADMIN)
  professionOptions: Array<{ value: Profession; label: string }> = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'DEVELOPER', label: 'Developer' },
    { value: 'OTHER', label: 'Other' },
    { value: 'EVALUATOR', label: 'Evaluator' },
    { value: 'UNKNOWN', label: 'Prefer not to say' },
  ];

  // ✅ IMPORTANT: profession is NOT NULL in backend, so give default value
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],

    // ✅ backend requires min 8
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],

    // ✅ backend @NotNull -> default is required
    profession: ['STUDENT' as Profession, [Validators.required]],

    // partner flow (optional)
    partnerID: [null as number | null],   // ✅ MUST be partnerID (capital D)
    partnerCode: [''],
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const v = this.form.value;

    const payload = {
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      password: v.password!,                 // already validated min 8
      profession: v.profession! as Profession, // never null now

      // ✅ send optional partner fields only if user filled something
      partnerID: v.partnerID ?? null, // ✅ matches backend field name
      partnerCode: (v.partnerCode ?? '').trim() || null,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.loading = false;
        // try to show server validation message if present
        this.error =
          e?.error?.message ||
          e?.error?.error ||
          'Registration failed';
      },
    });
  }
}