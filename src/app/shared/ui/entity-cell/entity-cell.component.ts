import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';

/**
 * خلية رئيسية في الجدول: صورة/حروف + عنوان + وصف صغير
 *   <app-entity-cell [title]="client.name" [subtitle]="client.clientCode" />
 */
@Component({
  selector: 'app-entity-cell',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    @if (showAvatar()) {
    <app-avatar [imageUrl]="imageUrl()" [name]="title()" [size]="36" />
    }
    <span class="entity-text">
      <strong [title]="title()">{{ title() || '—' }}</strong>
      @if (subtitle()) {
      <small [attr.dir]="subtitleDir()">{{ subtitle() }}</small>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      min-width: 0;
      max-width: 100%;
    }
    .entity-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.35;
    }
    strong {
      overflow: hidden;
      color: var(--color-text);
      font-weight: 700;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    small {
      overflow: hidden;
      color: var(--color-text-muted);
      font-size: 0.8rem;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly showAvatar = input(true);
  /** للإيميلات والأرقام الإنجليزي */
  readonly subtitleDir = input<'rtl' | 'ltr' | null>(null);
}
