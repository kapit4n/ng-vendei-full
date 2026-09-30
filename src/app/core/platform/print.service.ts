import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** A window opened for printing. */
export interface PrintHandle {
  /** Print the document. */
  print(): void;
  /** Close the window. Safe to call more than once. */
  close(): void;
  /** Emits once when the window has finished printing or been closed. */
  closed$: Observable<void>;
}

/**
 * Browser-side printing, isolated from the components that trigger it.
 *
 * The POS builds receipt HTML as a string and opens a popup window; that is
 * legitimate browser behaviour but it was reaching for `window`/`document`
 * directly. Routing it through one service keeps the components testable and
 * gives a single place to adapt if the desktop shell later needs printing
 * through the native layer instead.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly doc = inject(DOCUMENT);

  /** `null` when the browser blocked the popup. */
  open(html: string, features = 'width=400,height=600'): PrintHandle | null {
    const view = this.doc.defaultView;
    if (!view) {
      return null;
    }
    const popup = view.open('', '_blank', features);
    if (!popup) {
      return null;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    return {
      print: () => popup.print(),
      close: () => {
        if (!popup.closed) {
          popup.close();
        }
      },
      closed$: this.watchClosed(popup),
    };
  }

  /**
   * Some browsers never fire `afterprint` reliably, so completion is detected
   * from either the event or the window actually closing — whichever happens
   * first. Completes exactly once.
   */
  private watchClosed(popup: Window): Observable<void> {
    return new Observable<void>((subscriber) => {
      if (popup.closed) {
        subscriber.next();
        subscriber.complete();
        return;
      }
      const view = popup;
      const onAfterPrint = () => {
        if (view.closed) {
          subscriber.next();
          subscriber.complete();
        }
      };
      view.onafterprint = onAfterPrint;
      const timer = this.doc.defaultView?.setInterval(() => {
        if (view.closed) {
          subscriber.next();
          subscriber.complete();
        }
      }, 500);
      return () => {
        if (timer !== undefined) {
          this.doc.defaultView?.clearInterval(timer);
        }
        view.onafterprint = null;
      };
    });
  }
}
