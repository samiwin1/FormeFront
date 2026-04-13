import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { AdminApi, AdminUser, Profession } from '../../../core/services/admin.api';
import { HeaderComponent } from '../../components/header/header.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';


type StatusFilter = 'ALL' | 'ACTIVE' | 'DISABLED';
type SortKey =
  | 'name_asc' | 'name_desc'
  | 'email_asc' | 'email_desc'
  | 'profession_asc' | 'profession_desc'
  | 'status_asc' | 'status_desc';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, NavbarComponent, FooterComponent],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.css',
})
export class AdminManagementComponent {
  private fb = inject(FormBuilder);
  private api = inject(AdminApi);

  loading = false;
  saving = false;
  disabling = false;
  error: string | null = null;

  admins: AdminUser[] = [];
 professions: Profession[] = ['STUDENT', 'DEVELOPER', 'OTHER', 'EVALUATOR', 'UNKNOWN'];

  // Filters / sort / pagination
  qCtrl = new FormControl<string>('', { nonNullable: true });
  professionCtrl = new FormControl<string>('ALL', { nonNullable: true });
  statusCtrl = new FormControl<StatusFilter>('ALL', { nonNullable: true });
  sortCtrl = new FormControl<SortKey>('name_asc', { nonNullable: true });

  pageSizeCtrl = new FormControl<number>(10, { nonNullable: true });
  page = 1;

  // UX
  toast: string | null = null;

  // Modal
  confirmOpen = false;
  selected: AdminUser | null = null;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    profession: ['STUDENT' as Profession, [Validators.required]],
  });

  ngOnInit() {
    this.refresh();

    // Reset to page 1 when filters change
    const reset = () => (this.page = 1);
    this.qCtrl.valueChanges.subscribe(reset);
    this.professionCtrl.valueChanges.subscribe(reset);
    this.statusCtrl.valueChanges.subscribe(reset);
    this.sortCtrl.valueChanges.subscribe(reset);
    this.pageSizeCtrl.valueChanges.subscribe(reset);
  }

  refresh() {
    this.loading = true;
    this.error = null;

    this.api.list().subscribe({
      next: (res) => {
        this.admins = res ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Failed to load admins';
        this.loading = false;
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const v = this.form.value;

    this.api.create({
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      password: v.password!,
      profession: v.profession!,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset({ profession: 'STUDENT' as Profession });
        this.refresh();
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Create admin failed';
        this.saving = false;
      },
    });
  }

  // ===== Advanced computed lists =====
  get filtered(): AdminUser[] {
    const q = this.qCtrl.value.trim().toLowerCase();
    const prof = this.professionCtrl.value;
    const status = this.statusCtrl.value;

    let out = [...this.admins];

    if (q) {
      out = out.filter(a => {
        const name = `${a.firstName ?? ''} ${a.lastName ?? ''}`.toLowerCase();
        const email = (a.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    if (prof !== 'ALL') out = out.filter(a => a.profession === prof);

    if (status !== 'ALL') {
      out = out.filter(a => status === 'ACTIVE' ? this.isActive(a) : !this.isActive(a));
    }

    // Sort
    out.sort((a, b) => this.compare(a, b, this.sortCtrl.value));

    return out;
  }

  get totalPages(): number {
    const size = this.pageSizeCtrl.value;
    return Math.max(1, Math.ceil(this.filtered.length / size));
  }

  get paged(): AdminUser[] {
    const size = this.pageSizeCtrl.value;
    const start = (this.page - 1) * size;
    return this.filtered.slice(start, start + size);
  }

  prev() { this.page = Math.max(1, this.page - 1); }
  next() { this.page = Math.min(this.totalPages, this.page + 1); }

  private compare(a: AdminUser, b: AdminUser, key: SortKey): number {
    const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim().toLowerCase();
    const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim().toLowerCase();
    const emailA = (a.email ?? '').toLowerCase();
    const emailB = (b.email ?? '').toLowerCase();
    const profA = (a.profession ?? '').toLowerCase();
    const profB = (b.profession ?? '').toLowerCase();
    const stA = this.isActive(a) ? 0 : 1;
    const stB = this.isActive(b) ? 0 : 1;

    const cmp = (x: string, y: string) => x.localeCompare(y);
    const cmpNum = (x: number, y: number) => x - y;

    switch (key) {
      case 'name_asc': return cmp(nameA, nameB);
      case 'name_desc': return cmp(nameB, nameA);
      case 'email_asc': return cmp(emailA, emailB);
      case 'email_desc': return cmp(emailB, emailA);
      case 'profession_asc': return cmp(profA, profB);
      case 'profession_desc': return cmp(profB, profA);
      case 'status_asc': return cmpNum(stA, stB);
      case 'status_desc': return cmpNum(stB, stA);
    }
  }

  // ===== Actions =====
  openDisable(u: AdminUser) {
    this.selected = u;
    this.confirmOpen = true;
  }

  closeConfirm() {
    this.confirmOpen = false;
    this.selected = null;
  }

  confirmDisable() {
    if (!this.selected) return;
    this.disabling = true;
    this.error = null;

    this.api.disable(this.selected.id).subscribe({
      next: () => {
        this.disabling = false;
        this.closeConfirm();
        this.refresh();
      },
      error: (e) => {
        this.disabling = false;
        this.error = e?.error?.message ?? 'Disable failed';
      },
    });
  }

  isActive(u: AdminUser) {
    const val = (u as any).active ?? (u as any).isActive;
    return val !== false;
  }

  initials(u: AdminUser) {
    const a = (u.firstName?.[0] ?? 'A').toUpperCase();
    const b = (u.lastName?.[0] ?? 'D').toUpperCase();
    return `${a}${b}`;
  }

  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast = text;
      setTimeout(() => {
        if (this.toast === text) this.toast = null;
      }, 900);
    } catch {
      this.error = 'Clipboard not allowed (try HTTPS or localhost).';
    }
  }
}