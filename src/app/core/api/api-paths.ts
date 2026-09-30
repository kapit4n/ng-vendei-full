/**
 * Canonical resource paths exposed by the Node API.
 *
 * This list is the frontend's contract with `inventory-nod`. Any change here
 * must be mirrored in:
 *   - `proxy.conf.json`          (development)
 *   - `nginx.conf`               (server deployment)
 *   - `../inventory-nod/app.js`  (route mounting)
 *
 * Paths are kept exactly as the backend mounts them (camelCase included); the
 * refactoring deliberately does not rename endpoints.
 */
export const API_PATHS = {
  api: '/api',
  products: '/products',
  productPresentations: '/productPresentations',
  categories: '/categories',
  clients: '/clients',
  cashiers: '/cashiers',
  vendors: '/vendors',
  unitOfMeasures: '/unitOfMeasures',
  orders: '/orders',
  orderDetails: '/orderDetails',
  purchaseItems: '/purchase-items',
  inventoryLots: '/inventory-lots',
  storeProfiles: '/storeProfiles',
  catalogTemplates: '/catalogTemplates',
  productAttributeDefinitions: '/productAttributeDefinitions',
  productAttributeValues: '/productAttributeValues',
  productVariants: '/productVariants',
  angQuestions: '/ang-questions',
  angExams: '/ang-exams',
  angResults: '/ang-results',
  uploads: '/uploads',
} as const;

export type ApiResource = keyof typeof API_PATHS;

/** Sub-resource action segments that do not warrant their own entry above. */
export const API_ACTIONS = {
  todaySummary: 'today-summary',
  addToInventory: 'addToInventory',
  reduceInventory: 'reduceInventory',
  updateTotalSelled: 'updateTotalSelled',
  updateQuantitySelled: 'updateQuantitySelled',
  uploadImage: 'upload-image',
  apply: 'apply',
  default: 'default',
  dedup: 'dedup',
} as const;

/**
 * Every top-level collection the backend mounts. Used by the deployment
 * configuration generator so nginx and the dev proxy cannot silently drift
 * from the routes the app actually calls.
 */
export const API_COLLECTIONS: readonly string[] = Object.entries(API_PATHS)
  .filter(([key]) => key !== 'api' && key !== 'uploads')
  .map(([, path]) => path);
