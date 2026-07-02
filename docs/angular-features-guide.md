# Angular Features Guide

Quick reference of Angular features covered in the practice exams, organized by complexity.

---

## Basic

### Components
Class with `@Component` decorator, a template (HTML), and optional styles. Defines a `selector` (custom HTML tag) used to embed it in other templates.

### Templates & Binding
- **Interpolation**: `{{ expression }}` — renders the value as text.
- **Property binding**: `[property]="value"` — binds a class property to a DOM property.
- **Event binding**: `(event)="handler()"` — listens to DOM events.
- **Two-way binding**: `[(ngModel)]` — combines property + event binding (needs `FormsModule`).

### Directives
- **Structural**: `*ngIf` / `@if`, `*ngFor` / `@for`, `NgSwitch` — change DOM structure (add/remove elements).
- **Attribute**: `NgClass`, `NgStyle` — change element appearance/behavior.

### Pipes
Transform data in templates: `{{ value | pipeName }}`. Built-in: `date`, `async`, `uppercase`, etc.

### Components vs Directives
Components are directives **with a template**; directives (structural/attribute) have no template.

### @Input / @Output
- `@Input()` — passes data from parent to child.
- `@Output()` + `EventEmitter` — emits events from child to parent.

### Lifecycle Hooks (Basic)
- `ngOnInit` — initialization logic after inputs are set (called once).
- `ngOnDestroy` — cleanup before component is destroyed.
- Constructor runs first (class init), then `ngOnInit` (inputs available).

### NgModule
`@NgModule` container grouping components, directives, pipes, services. Root module is `AppModule`. The `providers` array registers services for DI.

### Angular CLI
`ng new`, `ng generate component`, `ng serve` (default port 4200). Config in `angular.json`.

### Safe Navigation Operator
`?.` — prevents errors when accessing properties of `null`/`undefined`.

---

## Intermediate

### Services & Dependency Injection
- `@Injectable()` decorator marks a class as injectable.
- `providedIn: "root"` — app-wide singleton (no need to add to `providers`).
- `providedIn: "any"` — new instance per lazy-loaded module.
- Providers can also be registered in `@NgModule` or `@Component`.

### Routing
- `RouterModule.forRoot(routes)` — root module configuration.
- `RouterModule.forChild(routes)` — feature module routing (no new router instance).
- **Route parameters**: `:id` in path, accessed via `ActivatedRoute.paramMap` or `snapshot.paramMap`.
- **Route guards**: `CanActivate`, `CanActivateChild`, `CanDeactivate`, `CanLoad`, `Resolve`.
- **Lazy loading**: `loadChildren: () => import('./module').then(m => m.Module)`.
- **Router events**: `NavigationStart`, `NavigationEnd`, etc. via `Router.events`.

### HttpClient
Typed HTTP requests (`GET`, `POST`, etc.). Error handling with `catchError` RxJS operator. **Interceptors** act as middleware for all requests/responses.

### Forms
- **Reactive forms**: `FormControl`, `FormGroup`, `FormBuilder`, `FormArray` — defined in TypeScript.
- **Template-driven forms**: directives in HTML (`ngModel`).
- Validators added as second argument to `FormControl`/`FormGroup`.

### Custom Pipes
`@Pipe({ name: 'myPipe', pure: true })` implementing `PipeTransform`. **Pure** pipes re-evaluate only when input changes; **impure** run on every CD cycle.

### ViewChild / ContentChild
- `@ViewChild` — queries an element/component/directive from the component's own view.
- `@ContentChild` — queries projected content (`<ng-content>`).

### Content Projection
`<ng-content>` creates a slot where parent components can insert content.

### Advanced Lifecycle Hooks (full order)
`ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → `ngOnDestroy`

### Change Detection (Intermediate)
- **Default**: checks entire component tree on any async event.
- **OnPush** (`ChangeDetectionStrategy.OnPush`): checks only when `@Input` changes, events fire, or async pipes emit.
- `trackBy` in `*ngFor` provides unique IDs to minimize DOM re-renders.

### View Encapsulation
Styles in `@Component` are scoped by default (emulated Shadow DOM). Options: `Emulated`, `ShadowDom`, `None`.

### @HostListener / @HostBinding
- `@HostListener` — listens to events on the host element.
- `@HostBinding` — binds a property to a host element property/attribute.

---

## Advanced

### Change Detection Deep Dive
- **Zone.js** monkey-patches async APIs (`setTimeout`, promises, DOM events). When patched callbacks fire, Angular's `ApplicationRef` triggers change detection.
- **Manual control**: `ChangeDetectorRef.detach()` stops checking, `reattach()` resumes, `detectChanges()` checks once.
- `NgZone.runOutsideAngular()` runs code outside the Angular zone (no CD triggered).

### Angular Ivy (vs View Engine)
Ivy is the modern renderer: smaller bundles, incremental compilation, better type checking, improved debugging.

### Angular Elements
Packages Angular components as **custom elements** (Web Components) usable in any HTML page.

### Dependency Injection Hierarchy
Injectors form a tree (platform → root module → component). Child injectors allow scoped service instances. Decorators control resolution:
- `@Self()` — resolve only from current injector.
- `@SkipSelf()` — skip current, resolve from parent.
- `@Optional()` — inject `null` if not found instead of throwing.
- `forwardRef()` — reference a class not yet defined (circular dependencies).

### Multi Providers & InjectionToken
- **Multi providers**: multiple providers for the same token, merged into an array (e.g., HTTP interceptors).
- **InjectionToken**: custom DI key for non-class dependencies (config objects, etc.).

### Custom Structural Directives
Inject `TemplateRef` (what to render) and `ViewContainerRef` (where to render), then call `createEmbeddedView()`. The `*` syntax is **microsyntax** — the compact expression language for structural directives.

### Testing
- **TestBed**: configures testing modules for unit tests.
- `TestBed.inject()` (preferred) vs deprecated `TestBed.get()`.
- `fakeAsync()` + `tick()` — simulates time, flushes pending async tasks synchronously.
- `discardPeriodicTasks()` — clears pending `setInterval` timers.
- `async` / `waitForAsync` — flushes pending microtasks.

### Compilation: JIT vs AOT
- **JIT** (Just-in-Time): compiles in the browser at runtime (dev mode).
- **AOT** (Ahead-of-Time): compiles during build — faster rendering, smaller bundles, earlier error detection.

### Performance Optimization
AOT + production mode + lazy loading + `OnPush` CD + CLI optimizations (budgets, minification). Use **Angular DevTools** to profile change detection cycles.

### Preloading Strategies
- `PreloadAllModules` — loads all lazy modules after bootstrap.
- `QuicklinkStrategy` — preloads modules based on viewport-visible links.

### Shared Modules
Create an `NgModule` that declares and exports common components, directives, pipes for reuse across features.

### Schematics
Code generators (`ng generate`) that create/modify/refactor project files programmatically.

### Internationalization (i18n)
Built-in system using `i18n` template decorators and `@angular/localize` for translations, locale formatting.

### PWA / Service Worker
`@angular/service-worker` enables offline support, caching strategies, and background sync for Progressive Web Apps.

### Tree-shaking
Ivy generates tree-shakeable code; Webpack/Rollup eliminate unused exports during production builds.
