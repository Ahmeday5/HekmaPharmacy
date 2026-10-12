import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { ModalComponent } from '../modal/modal.component';
import { ConfirmDialogService } from './confirm-dialog.service';

/** Host واحد للتأكيدات — بيتحط مرة واحدة في AppComponent */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, LoadingButtonComponent],
  template: `
    @if (confirmService.active(); as dialog) {
    <app-modal size="sm" [title]="dialog.title" [icon]="dialog.icon" [locked]="confirmService.busy()"
      (closed)="confirmService.cancel()">
      <p class="confirm-message">{{ dialog.message }}</p>
      <ng-container modalFooter>
        <button type="button" appLoadingButton class="btn btn-brand-{{ dialog.variant }}"
          [loading]="confirmService.busy()" (click)="confirmService.confirm()">
          {{ dialog.confirmText }}
        </button>
        <button type="button" class="btn btn-brand-light" [disabled]="confirmService.busy()"
          (click)="confirmService.cancel()">
          {{ dialog.cancelText }}
        </button>
      </ng-container>
    </app-modal>
    }
  `,
  styles: `
    .confirm-message {
      margin: 0;
      font-size: 1rem;
      line-height: 1.7;
      color: var(--color-text);
      white-space: pre-line;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly confirmService = inject(ConfirmDialogService);
}
