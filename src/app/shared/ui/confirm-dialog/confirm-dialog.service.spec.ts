import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    service = TestBed.inject(ConfirmDialogService);
  });

  it('resolves true on confirm and false on cancel', async () => {
    const confirmed = service.ask({ title: 't', message: 'm' });
    await service.confirm();
    expect(await confirmed).toBeTrue();

    const cancelled = service.ask({ title: 't', message: 'm' });
    service.cancel();
    expect(await cancelled).toBeFalse();
    expect(service.active()).toBeNull();
  });

  it('stays open and busy until the action completes', async () => {
    const action$ = new Subject<void>();
    const result = service.confirmDelete('العميل', () => action$);

    const confirming = service.confirm();
    expect(service.busy()).toBeTrue();
    expect(service.active()).not.toBeNull();

    service.cancel(); // ممنوع الإلغاء أثناء التنفيذ
    expect(service.active()).not.toBeNull();

    action$.complete();
    await confirming;
    expect(await result).toBeTrue();
    expect(service.busy()).toBeFalse();
    expect(service.active()).toBeNull();
  });

  it('rejects with the error when the action fails', async () => {
    const error = new Error('delete failed');
    const result = service.confirmDelete('العميل', () => Promise.reject(error));
    await service.confirm();

    await expectAsync(result).toBeRejectedWith(error);
    expect(service.active()).toBeNull();
  });
});
