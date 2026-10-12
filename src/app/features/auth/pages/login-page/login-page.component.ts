import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { getValidationMessage } from '../../../../shared/forms/validation-messages';
import { LoadingButtonComponent } from '../../../../shared/ui/loading-button/loading-button.component';

const DEFAULT_REDIRECT = '/dashboard';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: [this.auth.savedEmail ?? '', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [this.auth.savedEmail !== null],
  });

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected fieldError(name: 'email' | 'password'): string | null {
    const control = this.form.controls[name];
    return control.touched ? getValidationMessage(control.errors) : null;
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const { email, password, rememberMe } = this.form.getRawValue();
      await this.auth.login({ email: email.trim(), password, rememberMe });
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'تعذر تسجيل الدخول');
    } finally {
      this.loading.set(false);
    }
  }

  /** يمنع التحويل لدومين خارجي عن طريق returnUrl */
  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : DEFAULT_REDIRECT;
  }
}
