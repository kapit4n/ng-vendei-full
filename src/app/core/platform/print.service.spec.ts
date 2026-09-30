import { TestBed } from '@angular/core/testing';

import { PrintService } from './print.service';

describe('PrintService', () => {
  let svc: PrintService;
  let popup: jasmine.SpyObj<Window>;
  let openSpy: jasmine.Spy;

  beforeEach(() => {
    const fakeDoc = jasmine.createSpyObj<Document>('Document', ['open', 'write', 'close']);
    popup = jasmine.createSpyObj<Window>('Window', ['print', 'close', 'focus']);
    (popup as unknown as Record<string, unknown>)['document'] = fakeDoc;
    (popup as unknown as Record<string, unknown>)['closed'] = false;
    openSpy = spyOn(window, 'open').and.returnValue(popup as unknown as Window);

    TestBed.configureTestingModule({});
    svc = TestBed.inject(PrintService);
  });

  afterEach(() => ((window as unknown as { open: unknown }).open = openSpy.and.stub()));

  it('returns null when no popup is available', () => {
    openSpy.and.returnValue(null);
    expect(svc.open('<html></html>')).toBeNull();
  });

  it('writes the document into the popup', () => {
    svc.open('<html>receipt</html>');
    expect(popup.document.write).toHaveBeenCalledWith('<html>receipt</html>');
  });

  it('forwards window features', () => {
    svc.open('<html></html>', 'width=600,height=400');
    expect(openSpy).toHaveBeenCalledWith('', '_blank', 'width=600,height=400');
  });

  it('prints and closes through the handle', () => {
    const handle = svc.open('<html></html>')!;
    handle.print();
    expect(popup.print).toHaveBeenCalled();

    handle.close();
    expect(popup.close).toHaveBeenCalled();
  });

  it('does not call close twice', () => {
    const handle = svc.open('<html></html>')!;
    handle.close();
    // The browser reports a user-closed window through `closed`; the handle
    // must not then call close() again.
    (popup as unknown as Record<string, unknown>)['closed'] = true;
    handle.close();
    expect(popup.close).toHaveBeenCalledTimes(1);
  });

  it('emits and completes once the popup is observed closed', (done) => {
    const handle = svc.open('<html></html>')!;
    let emissions = 0;
    handle.closed$.subscribe({
      next: () => emissions++,
      complete: () => {
        expect(emissions).toBe(1);
        done();
      },
    });
    setTimeout(() => ((popup as unknown as Record<string, unknown>)['closed'] = true), 600);
  });

  it('does not emit while the popup is still open', (done) => {
    const handle = svc.open('<html></html>')!;
    let emitted = false;
    const subscription = handle.closed$.subscribe({ next: () => (emitted = true) });
    setTimeout(() => {
      expect(emitted).toBe(false);
      subscription.unsubscribe();
      done();
    }, 800);
  });

  it('completes immediately for an already-closed popup', (done) => {
    (popup as unknown as Record<string, unknown>)['closed'] = true;
    const handle = svc.open('<html></html>')!;
    let emissions = 0;
    handle.closed$.subscribe({
      next: () => emissions++,
      complete: () => {
        expect(emissions).toBe(1);
        done();
      },
    });
  });
});
