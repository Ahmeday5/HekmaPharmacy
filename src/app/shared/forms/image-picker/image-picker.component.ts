import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImageCropperComponent, ImageTransform } from 'ngx-image-cropper';
import { LoadingButtonComponent } from '../../ui/loading-button/loading-button.component';
import {
  ACCEPTED_IMAGE_TYPES,
  blobToImageFile,
  validateImageFile,
} from '../../utils/image-file.util';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

/**
 * اختيار صورة + قصها — Form control قيمته File | null:
 *   <app-image-picker formControlName="image" [currentImageUrl]="existingUrl" />
 */
@Component({
  selector: 'app-image-picker',
  standalone: true,
  imports: [ImageCropperComponent, LoadingButtonComponent],
  templateUrl: './image-picker.component.html',
  styleUrl: './image-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImagePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePickerComponent implements ControlValueAccessor, OnDestroy {
  readonly inputId = input<string>();
  /** الصورة الحالية (في وضع التعديل) — بتظهر لحد ما المستخدم يختار صورة جديدة */
  readonly currentImageUrl = input<string | null>(null);
  readonly aspectRatio = input(1);
  readonly roundCropper = input(true);
  /** أقصى عرض للصورة الناتجة بالبكسل — بيقلل حجم الرفع */
  readonly outputWidth = input(600);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly cropper = viewChild(ImageCropperComponent);

  protected readonly acceptedTypes = ACCEPTED_IMAGE_TYPES.join(',');
  protected readonly sourceFile = signal<File | null>(null);
  protected readonly croppedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isCropping = signal(false);
  protected readonly isCropperReady = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly disabled = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly canvasRotation = signal(0);
  protected readonly transform = signal<ImageTransform>({});

  private onChange: (file: File | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /* ---------------- ControlValueAccessor ---------------- */

  writeValue(file: File | null): void {
    // الـ form بيبعت null عند reset — غير كده القيمة بتيجي مننا
    if (!file) {
      this.clear();
    }
  }

  registerOnChange(fn: (file: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /* ---------------- اختيار الملف ---------------- */

  protected openFileDialog(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.onTouched();
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.errorMessage.set('');
    this.sourceFile.set(file);
    this.openCropper();
  }

  /* ---------------- أدوات القص ---------------- */

  protected zoom(direction: 1 | -1): void {
    const scale = (this.transform().scale ?? 1) + direction * ZOOM_STEP;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
    this.transform.update((t) => ({ ...t, scale: Number(clamped.toFixed(2)) }));
  }

  protected rotate(direction: 1 | -1): void {
    this.canvasRotation.update((r) => (r + direction + 4) % 4);
    // بعد التدوير 90° القلب الأفقي والرأسي بيتبادلوا
    this.transform.update((t) => ({ ...t, flipH: t.flipV, flipV: t.flipH }));
  }

  protected flipHorizontal(): void {
    this.transform.update((t) => ({ ...t, flipH: !t.flipH }));
  }

  protected resetAdjustments(): void {
    this.canvasRotation.set(0);
    this.transform.set({});
  }

  protected onLoadImageFailed(): void {
    this.errorMessage.set('تعذر قراءة الصورة، يرجى اختيار صورة أخرى');
    this.clear();
  }

  /* ---------------- تأكيد / إلغاء ---------------- */

  protected async confirmCrop(): Promise<void> {
    const source = this.sourceFile();
    const cropResult = this.cropper()?.crop('blob');
    if (!cropResult || !source) {
      return;
    }

    this.isProcessing.set(true);
    try {
      const { blob, objectUrl } = await cropResult;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (!blob) {
        throw new Error('Empty crop result');
      }
      const file = blobToImageFile(blob, source.name);
      this.croppedFile.set(file);
      this.setPreview(URL.createObjectURL(file));
      this.isCropping.set(false);
      this.onChange(file);
    } catch {
      this.errorMessage.set('حدث خطأ أثناء قص الصورة، حاول مرة أخرى');
    } finally {
      this.isProcessing.set(false);
    }
  }

  protected cancelCrop(): void {
    // في إعادة القص نحتفظ بالنتيجة السابقة، غير كده نلغي الاختيار
    if (this.croppedFile()) {
      this.isCropping.set(false);
    } else {
      this.clear();
    }
  }

  protected recrop(): void {
    if (this.sourceFile()) {
      this.openCropper();
    }
  }

  protected remove(): void {
    this.clear();
    this.onChange(null);
  }

  ngOnDestroy(): void {
    this.setPreview(null);
  }

  private openCropper(): void {
    this.resetAdjustments();
    this.isCropperReady.set(false);
    this.isCropping.set(true);
  }

  private setPreview(url: string | null): void {
    const previous = this.previewUrl();
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    this.previewUrl.set(url);
  }

  private clear(): void {
    this.sourceFile.set(null);
    this.croppedFile.set(null);
    this.isCropping.set(false);
    this.isCropperReady.set(false);
    this.resetAdjustments();
    this.setPreview(null);
  }
}
