import { Component } from '@angular/core';

interface GuideSection {
  title: string;
  items: GuideItem[];
}

interface GuideItem {
  term: string;
  desc: string;
}

@Component({
  selector: 'app-ang-features-guide',
  templateUrl: './ang-features-guide.component.html',
  styleUrls: ['./ang-features-guide.component.css'],
  standalone: false,
})
export class AngFeaturesGuideComponent {
  readonly sections: GuideSection[] = [
    {
      title: 'Basic',
      items: [
        {
          term: 'Components',
          desc: 'Class with <code>@Component</code> decorator, a template (HTML), and optional styles. The <code>selector</code> defines a custom HTML tag used to embed it in other templates.',
        },
        {
          term: 'Templates & Binding',
          desc: '<b>Interpolation</b>: <code>{{ expression }}</code> — renders value as text. <b>Property binding</b>: <code>[property]="value"</code> — binds a class property to a DOM property. <b>Event binding</b>: <code>(event)="handler()"</code> — listens to DOM events. <b>Two-way binding</b>: <code>[(ngModel)]</code> (needs <code>FormsModule</code>).',
        },
        {
          term: 'Directives',
          desc: '<b>Structural</b>: <code>*ngIf</code> / <code>@if</code>, <code>*ngFor</code> / <code>@for</code>, <code>NgSwitch</code> — change DOM structure. <b>Attribute</b>: <code>NgClass</code>, <code>NgStyle</code> — change element appearance or behavior.',
        },
        {
          term: 'Pipes',
          desc: 'Transform data in templates: <code>{{ value | pipeName }}</code>. Built-in: <code>date</code>, <code>async</code>, <code>uppercase</code>, etc.',
        },
        {
          term: 'Components vs Directives',
          desc: 'Components are directives <b>with a template</b>; directives (structural / attribute) have no template of their own.',
        },
        {
          term: '@Input / @Output',
          desc: '<code>@Input()</code> passes data from parent to child. <code>@Output()</code> + <code>EventEmitter</code> emits events from child to parent.',
        },
        {
          term: 'Lifecycle Hooks (basic)',
          desc: 'Constructor runs first (class init). <code>ngOnInit</code> runs after inputs are set (called once). <code>ngOnDestroy</code> cleans up before destruction.',
        },
        {
          term: 'NgModule',
          desc: 'Container (<code>@NgModule</code>) grouping components, directives, pipes, services. Root is <code>AppModule</code>. The <code>providers</code> array registers services for DI.',
        },
        {
          term: 'Angular CLI',
          desc: '<code>ng new</code>, <code>ng generate component</code>, <code>ng serve</code> (default port 4200). Config in <code>angular.json</code>.',
        },
        {
          term: 'Safe Navigation Operator',
          desc: '<code>?.</code> — prevents errors when accessing properties of <code>null</code> or <code>undefined</code>.',
        },
      ],
    },
    {
      title: 'Intermediate',
      items: [
        {
          term: 'Services & Dependency Injection',
          desc: '<code>@Injectable()</code> marks a class as injectable. <code>providedIn: "root"</code> creates an app-wide singleton. <code>providedIn: "any"</code> creates a new instance per lazy-loaded module. Providers can also be set in <code>@NgModule</code> or <code>@Component</code>.',
        },
        {
          term: 'Routing',
          desc: '<code>RouterModule.forRoot(routes)</code> for root config; <code>forChild(routes)</code> for feature modules. Route parameters use <code>:id</code> syntax, accessed via <code>ActivatedRoute.paramMap</code>. Guards: <code>CanActivate</code>, <code>CanDeactivate</code>, <code>CanLoad</code>, <code>Resolve</code>, <code>CanActivateChild</code>. Lazy loading: <code>loadChildren: () => import(...)</code>. Router emits events via <code>Router.events</code>.',
        },
        {
          term: 'HttpClient',
          desc: 'Typed HTTP requests. Error handling with <code>catchError</code> RxJS operator. <b>Interceptors</b> act as middleware for all requests / responses.',
        },
        {
          term: 'Forms',
          desc: '<b>Reactive</b>: <code>FormControl</code>, <code>FormGroup</code>, <code>FormBuilder</code>, <code>FormArray</code> — defined in TypeScript. <b>Template-driven</b>: directives in HTML (<code>ngModel</code>). Validators passed as second argument to controls.',
        },
        {
          term: 'Custom Pipes',
          desc: '<code>@Pipe({ name, pure })</code> implementing <code>PipeTransform</code>. <b>Pure</b> pipes re-evaluate only when input changes; <b>impure</b> run on every CD cycle.',
        },
        {
          term: 'ViewChild / ContentChild',
          desc: '<code>@ViewChild</code> queries an element/component from the view. <code>@ContentChild</code> queries projected content (<code>&lt;ng-content&gt;</code>).',
        },
        {
          term: 'Content Projection',
          desc: '<code>&lt;ng-content&gt;</code> creates a slot where parent components can insert content into a child.',
        },
        {
          term: 'Lifecycle Hooks (full order)',
          desc: '<code>ngOnChanges</code> → <code>ngOnInit</code> → <code>ngDoCheck</code> → <code>ngAfterContentInit</code> → <code>ngAfterContentChecked</code> → <code>ngAfterViewInit</code> → <code>ngAfterViewChecked</code> → <code>ngOnDestroy</code>',
        },
        {
          term: 'Change Detection (OnPush)',
          desc: '<code>ChangeDetectionStrategy.OnPush</code> checks only when <code>@Input</code> changes, events fire, or async pipes emit. Use <code>trackBy</code> in <code>*ngFor</code> to minimize DOM re-renders.',
        },
        {
          term: 'View Encapsulation',
          desc: 'Styles in <code>@Component</code> are scoped by default (emulated Shadow DOM). Options: <code>Emulated</code>, <code>ShadowDom</code>, <code>None</code>.',
        },
        {
          term: '@HostListener / @HostBinding',
          desc: '<code>@HostListener</code> listens to events on the host element. <code>@HostBinding</code> binds a property to a host element property / attribute.',
        },
      ],
    },
    {
      title: 'Advanced',
      items: [
        {
          term: 'Change Detection (Deep Dive)',
          desc: '<b>Zone.js</b> monkey-patches async APIs. When patched callbacks fire, Angular triggers tree traversal. <code>ChangeDetectorRef.detach()</code> stops checking, <code>reattach()</code> resumes, <code>detectChanges()</code> checks once. <code>NgZone.runOutsideAngular()</code> runs code without triggering CD.',
        },
        {
          term: 'Ivy vs View Engine',
          desc: 'Ivy is the modern renderer: smaller bundles, incremental compilation, better type checking, improved debugging.',
        },
        {
          term: 'Angular Elements',
          desc: 'Packages Angular components as <b>custom elements</b> (Web Components) usable in any HTML page.',
        },
        {
          term: 'DI Hierarchy & Decorators',
          desc: 'Injectors form a tree (platform → root module → component). <code>@Self()</code> — resolve only from current injector. <code>@SkipSelf()</code> — skip current, resolve from parent. <code>@Optional()</code> — inject <code>null</code> if not found. <code>forwardRef()</code> — circular dependency resolution.',
        },
        {
          term: 'Multi Providers & InjectionToken',
          desc: '<b>Multi providers</b>: multiple providers for the same token merged into an array (used for HTTP interceptors). <b>InjectionToken</b>: custom DI key for non-class dependencies (config objects).',
        },
        {
          term: 'Custom Structural Directives',
          desc: 'Inject <code>TemplateRef</code> (what to render) and <code>ViewContainerRef</code> (where), then call <code>createEmbeddedView()</code>. The <code>*</code> syntax is <b>microsyntax</b> — the compact expression language for structural directives.',
        },
        {
          term: 'Testing',
          desc: '<b>TestBed</b> configures testing modules. <code>TestBed.inject()</code> (modern) vs deprecated <code>TestBed.get()</code>. <code>fakeAsync()</code> + <code>tick()</code> simulates time synchronously. <code>discardPeriodicTasks()</code> clears pending <code>setInterval</code>.',
        },
        {
          term: 'JIT vs AOT Compilation',
          desc: '<b>JIT</b> compiles in the browser at runtime (dev mode). <b>AOT</b> compiles during build — faster rendering, smaller bundles, earlier error detection.',
        },
        {
          term: 'Production Optimization',
          desc: 'AOT + production mode + lazy loading + OnPush CD + CLI optimizations (budgets, minification). Use <b>Angular DevTools</b> to profile CD cycles.',
        },
        {
          term: 'Preloading Strategies',
          desc: '<code>PreloadAllModules</code> — loads all lazy modules after bootstrap. <code>QuicklinkStrategy</code> — preloads based on viewport-visible links.',
        },
        {
          term: 'Shared Modules',
          desc: 'Create an <code>NgModule</code> that declares and exports common components, directives, pipes for reuse across features.',
        },
        {
          term: 'Schematics',
          desc: 'Code generators (<code>ng generate</code>) that create / modify / refactor project files programmatically.',
        },
        {
          term: 'Internationalization (i18n)',
          desc: 'Built-in using <code>i18n</code> template decorators and <code>@angular/localize</code> for translations and locale formatting.',
        },
        {
          term: 'PWA / Service Worker',
          desc: '<code>@angular/service-worker</code> enables offline support, caching strategies, and background sync for Progressive Web Apps.',
        },
        {
          term: 'Tree-shaking',
          desc: 'Ivy generates tree-shakeable code; Webpack / Rollup eliminate unused exports during production builds.',
        },
      ],
    },
  ];
}
