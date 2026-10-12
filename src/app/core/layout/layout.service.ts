import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { BreakpointService } from './breakpoint.service';

const COLLAPSED_STORAGE_KEY = 'hekma.sidebar.collapsed';
const DRAWER_SCROLL_LOCK_CLASS = 'drawer-scroll-lock';

/**
 * حالة الـ layout:
 * - Desktop: السايدبار بيتصغر لأيقونات بس، والاختيار بيتحفظ.
 * - Tablet/Mobile: السايدبار drawer بيتفتح ويتقفل بزرار في الهيدر.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly breakpoints = inject(BreakpointService);
  private readonly collapsedPreference = signal(localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true');

  readonly isCompact = this.breakpoints.isCompact;
  readonly mobileOpen = signal(false);
  /** التصغير ليه معنى على الـ desktop بس */
  readonly collapsed = computed(() => !this.isCompact() && this.collapsedPreference());

  constructor() {
    // لو الشاشة كبرت والـ drawer مفتوح نقفله
    effect(() => {
      if (!this.isCompact()) {
        untracked(() => this.mobileOpen.set(false));
      }
    });
    effect(() => document.body.classList.toggle(DRAWER_SCROLL_LOCK_CLASS, this.mobileOpen()));
  }

  toggleSidebar(): void {
    if (this.isCompact()) {
      this.mobileOpen.update((open) => !open);
    } else {
      this.setCollapsed(!this.collapsedPreference());
    }
  }

  closeMobileSidebar(): void {
    this.mobileOpen.set(false);
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsedPreference.set(collapsed);
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }
}
