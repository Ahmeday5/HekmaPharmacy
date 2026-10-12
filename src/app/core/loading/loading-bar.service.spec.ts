import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { LoadingBarService } from './loading-bar.service';

describe('LoadingBarService', () => {
  let service: LoadingBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(LoadingBarService);
  });

  it('does not show for operations faster than the delay (no flicker)', fakeAsync(() => {
    of('fast').pipe(service.track()).subscribe();
    tick(500);
    expect(service.state()).toBe('idle');
  }));

  it('shows while slow operations run and completes once all of them finish', fakeAsync(() => {
    const first = new Subject<void>();
    const second = new Subject<void>();
    first.pipe(service.track()).subscribe();
    second.pipe(service.track()).subscribe();

    tick(200);
    expect(service.state()).toBe('loading');

    first.complete();
    expect(service.state()).toBe('loading');

    second.complete();
    expect(service.state()).toBe('done');

    tick(500);
    expect(service.state()).toBe('idle');
  }));

  it('stops tracking when the subscription is cancelled', fakeAsync(() => {
    const subscription = new Subject<void>().pipe(service.track()).subscribe();
    tick(200);
    subscription.unsubscribe();
    tick(500);
    expect(service.state()).toBe('idle');
  }));
});
