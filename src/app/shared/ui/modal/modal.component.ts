import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/** المودالز المفتوحة بالترتيب — ESC بيقفل اللي فوق بس */
const openModals: ModalComponent[] = [];
let modalIdCounter = 0;

/**
 * المودال الوحيد في المشروع — كل الفورمز والتأكيدات مبنية عليه.
 *
 * المودال مفتوح طول ما هو موجود في الـ DOM، فبيتفتح بـ @if من الـ parent:
 *   @if (isOpen()) {
 *     <app-modal title="..." (closed)="isOpen.set(false)">
 *       ...body...
 *       <ng-container modalFooter>...buttons...</ng-container>
 *     </app-modal>
 *   }
 * ده بيضمن إن كل فتح يبدأ بـ state نظيفة.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
  readonly size = input<ModalSize>('md');
  /** يمنع القفل (مثلًا أثناء الحفظ) */
  readonly locked = input(false);
  readonly closeOnBackdrop = input(true);

  readonly closed = output<void>();

  protected readonly titleId = `app-modal-title-${++modalIdCounter}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  constructor() {
    openModals.push(this);
    document.body.classList.add('modal-scroll-lock');
  }

  ngAfterViewInit(): void {
    const dialog = this.dialog().nativeElement;
    const firstField = dialog.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([disabled]), select, textarea',
    );
    (firstField ?? dialog).focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    openModals.splice(openModals.indexOf(this), 1);
    if (openModals.length === 0) {
      document.body.classList.remove('modal-scroll-lock');
    }
    this.previouslyFocused?.focus?.({ preventScroll: true });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (openModals.at(-1) === this) {
      this.requestClose();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  protected requestClose(): void {
    if (!this.locked()) {
      this.closed.emit();
    }
  }
}
