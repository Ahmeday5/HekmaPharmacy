import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

/** الـ layout بتاع كل الصفحات المحمية: سايدبار + هيدر + المحتوى */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <a class="skip-link" href="#main-content">تخطي إلى المحتوى</a>
    <app-sidebar />
    <div class="shell-body" [class.sidebar-collapsed]="layout.collapsed()" [class.compact]="layout.isCompact()">
      <app-topbar />
      <main id="main-content" class="shell-main" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell-body {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      margin-inline-start: var(--sidebar-width);
      transition: margin var(--layout-transition);
    }
    .shell-body.sidebar-collapsed {
      margin-inline-start: var(--sidebar-collapsed-width);
    }
    .shell-body.compact {
      margin-inline-start: 0;
    }
    .shell-main {
      flex: 1;
      outline: none;
    }
    .skip-link {
      position: fixed;
      top: 0.5rem;
      inset-inline-start: 0.5rem;
      z-index: var(--z-toast);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--color-primary);
      color: var(--color-on-primary);
      transform: translateY(-150%);
    }
    .skip-link:focus {
      transform: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly layout = inject(LayoutService);
}
