import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { LogoutService } from '../../auth/logout.service';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly logoutService = inject(LogoutService);

  protected readonly user = inject(AuthService).currentUser;
  protected readonly open = signal(false);

  @HostListener('document:click', ['$event.target'])
  protected onDocumentClick(target: EventTarget | null): void {
    if (this.open() && !this.host.nativeElement.contains(target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  protected logout(): void {
    this.open.set(false);
    this.logoutService.confirmLogout();
  }
}
