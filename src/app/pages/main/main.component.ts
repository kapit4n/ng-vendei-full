import { Component } from '@angular/core';

export interface MainHubTile {
  title: string;
  description: string;
  path: string;
  matIcon: string;
}

export interface MainHubSection {
  id: string;
  label: string;
  subtitle: string;
  matIcon: string;
  tiles: MainHubTile[];
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  standalone: false,
})
export class MainComponent {
  /** Grouped navigation for the application shell. */
  readonly hubSections: MainHubSection[] = [
    {
      id: 'sell',
      label: 'Sales floor',
      subtitle: 'Checkout and customer lookup',
      matIcon: 'storefront',
      tiles: [
        {
          title: 'Shopping cart',
          description: 'Ring up sales, discounts, and payments',
          path: '/',
          matIcon: 'shopping_cart',
        },
        {
          title: 'Customer directory',
          description: 'Find a customer to attach to a sale',
          path: '/customers',
          matIcon: 'person_search',
        },
      ],
    },
    {
      id: 'catalog',
      label: 'Catalog & master data',
      subtitle: 'What you sell and how it is measured',
      matIcon: 'inventory_2',
      tiles: [
        {
          title: 'Categories',
          description: 'Organize products into groups',
          path: '/reg/categories',
          matIcon: 'category',
        },
        {
          title: 'Units of measure',
          description: 'Kg, box, unit, and other sellable units',
          path: '/reg/unit-of-measures',
          matIcon: 'straighten',
        },
        {
          title: 'Products',
          description: 'Items, images, expiry, and presentations',
          path: '/reg/products',
          matIcon: 'qr_code_2',
        },
        {
          title: 'Customers',
          description: 'Register and edit customer records',
          path: '/reg/customers',
          matIcon: 'groups',
        },
      ],
    },
    {
      id: 'stock',
      label: 'Stock',
      subtitle: 'On-hand quantities and purchase history',
      matIcon: 'warehouse',
      tiles: [
        {
          title: 'Inventory',
          description: 'Stock levels, lots, and receiving',
          path: '/inv/products',
          matIcon: 'shelves',
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      subtitle: 'Performance and product analytics',
      matIcon: 'insights',
      tiles: [
        {
          title: 'Product sales',
          description: 'Totals and trends by product',
          path: '/rep/products',
          matIcon: 'bar_chart',
        },
        {
          title: 'Sales analytics',
          description: 'Revenue, range filters, and charts',
          path: '/rep/sells',
          matIcon: 'trending_up',
        },
      ],
    },
  ];
}
