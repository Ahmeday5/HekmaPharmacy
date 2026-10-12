import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { LayoutService } from '../layout.service';
import { NetworkStatusService } from '../network-status.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

const DATE_FORMAT = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [UserMenuComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly router = inject(Router);

  protected readonly layout = inject(LayoutService);
  protected readonly online = inject(NetworkStatusService).online;
  protected readonly today = DATE_FORMAT.format(new Date());

  /** عنوان الصفحة من الـ route title */
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.resolveTitle()),
    ),
    { initialValue: this.resolveTitle() },
  );

  private resolveTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? '';
  }
}
