import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './core/loading/loading-bar.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/ui/toast/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingBarComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <app-loading-bar />
    <router-outlet />
    <app-confirm-dialog />
    <app-toast-container />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
