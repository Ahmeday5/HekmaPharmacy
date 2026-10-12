import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutService } from '../../auth/logout.service';
import { LayoutService } from '../layout.service';
import { NAV_SECTIONS } from '../navigation';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly logoutService = inject(LogoutService);
  protected readonly sections = NAV_SECTIONS;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.layout.closeMobileSidebar();
  }
}
