import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, Subject } from 'rxjs';

/** خانة بحث بـ debounce — بتبعت القيمة بعد ما المستخدم يوقف كتابة */
@Component({
  selector: 'app-search-input',
  standalone: true,
  template: `
    <div class="input-adorned">
      <i class="input-adorned-icon fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input
        type="search"
        class="form-control"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="text()"
        (input)="onInput($any($event.target).value)"
        (keydown.enter)="flush()"
      />
      @if (text()) {
      <button type="button" class="input-adorned-clear" (click)="clear()" aria-label="مسح البحث">
        <i class="fa-solid fa-xmark"></i>
      </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit {
  readonly placeholder = input('بحث...');
  readonly value = input('');
  readonly debounceMs = input(400);

  readonly search = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly input$ = new Subject<string>();
  private lastEmitted = '';
  protected readonly text = signal('');

  constructor() {
    // مزامنة مع القيمة الخارجية (مثلًا "مسح الفلاتر") من غير ما نلمس اللي المستخدم بيكتبه
    effect(() => {
      const external = this.value();
      untracked(() => {
        this.lastEmitted = external.trim();
        if (external.trim() !== this.text().trim()) {
          this.text.set(external);
        }
      });
    });
  }

  ngOnInit(): void {
    this.input$
      .pipe(
        debounceTime(this.debounceMs()),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.emit(value));
  }

  protected onInput(value: string): void {
    this.text.set(value);
    this.input$.next(value);
  }

  protected flush(): void {
    this.emit(this.text().trim());
  }

  protected clear(): void {
    this.text.set('');
    this.input$.next('');
    this.emit('');
  }

  private emit(value: string): void {
    if (value !== this.lastEmitted) {
      this.lastEmitted = value;
      this.search.emit(value);
    }
  }
}
