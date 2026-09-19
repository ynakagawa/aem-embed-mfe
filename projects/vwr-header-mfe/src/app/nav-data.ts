// Mirrors the authored content at https://main--vwr--ynaka-adobe.aem.live/nav.plain.html
// (fetched 2026-09-02). This is a visual/structural clone, not a live fragment fetch -
// see README for why (this widget is meant to run on a different origin than the
// content it mirrors, and re-fetching it live would just reintroduce the CORS/embedding
// problems this demo already covers in the other direction).
export const SITE_ORIGIN = 'https://main--vwr--ynaka-adobe.aem.live';

/** A locale the country switcher can navigate to. */
export interface CountryOption {
  /** English display name; override per locale with a `country.<path>` label. */
  label: string;
  /** Locale root path. English lives under /us/en; others under /<language>. */
  path: string;
  /** Used for the flag modifier class. */
  code: string;
}

export const COUNTRIES: CountryOption[] = [
  { label: 'United States', path: '/us/en', code: 'us' },
  { label: 'Japan', path: '/jp', code: 'jp' },
  { label: 'Germany', path: '/de', code: 'de' },
];

export interface NavLink {
  label: string;
  href: string;
}

export interface NavSection extends NavLink {
  items: NavLink[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Products',
    href: '/us/en/products',
    items: [
      { label: 'View All Products', href: '/us/en/products' },
      { label: 'Life Science Products', href: '/us/en/products/life-sciences' },
      { label: 'Laboratory Furniture', href: '/us/en/products/laboratory-furniture' },
      { label: 'Chemicals', href: '/us/en/products/chemicals' },
      { label: 'Equipment & Instruments', href: '/us/en/products/equipment-instrumentation' },
      { label: 'Chromatography', href: '/us/en/products/chromatography' },
      { label: 'Healthcare Products', href: '/us/en/products/healthcare' },
      { label: 'Controlled Environment, Safety & PPE', href: '/us/en/products/controlled-environment' },
    ],
  },
  {
    label: 'Services',
    href: '/us/en/services',
    items: [
      { label: 'View All Services', href: '/us/en/services' },
      { label: 'Laboratory & Production Services', href: '/us/en/services/lab-production' },
      { label: 'Procurement & Material Management Services', href: '/us/en/services/procurement-and-material-management' },
      { label: 'Procurement & Supply Chain Services', href: '/us/en/services/procurement-supply-chain' },
      { label: 'Inventory Management Solutions', href: '/us/en/services/inventory-management-solutions' },
      { label: 'Chemical Management Solutions', href: '/us/en/services/chemical-management-solutions' },
      { label: 'General Lab Services', href: '/us/en/services/general-lab' },
      { label: 'Technical Lab Services', href: '/us/en/services/technical-lab' },
      { label: 'Scientific Services', href: '/us/en/services/scientific' },
      { label: 'Media & Buffer Preparation', href: '/us/en/services/media-buffer-preparation' },
      { label: 'Sample Management Services', href: '/us/en/services/sample-management' },
      { label: 'Production Services', href: '/us/en/services/production' },
      { label: 'Critical Environment & Sanitization', href: '/us/en/services/critical-environment-sanitization' },
      { label: 'Equipment & Instrument Services', href: '/us/en/services/equipment' },
      { label: 'Compliance Services', href: '/us/en/services/laboratory-compliance' },
      { label: 'New Lab Start-Up', href: '/us/en/services/lab-startup-program' },
    ],
  },
  {
    label: 'Digital Solutions',
    href: '/us/en/digital-solutions',
    items: [
      { label: 'View All Digital Solutions', href: '/us/en/digital-solutions' },
      { label: 'Workflow Optimization', href: '/us/en/digital-solutions/workflow-optimization' },
      { label: 'Software Solutions', href: '/us/en/digital-solutions/software-solutions' },
      { label: 'Chemical Manager', href: '/us/en/digital-solutions/chemical-manager' },
      { label: 'Equipment Manager', href: '/us/en/digital-solutions/equipment-manager' },
      { label: 'Hardware Solutions', href: '/us/en/digital-solutions/hardware-solutions' },
      { label: 'Digital Commerce', href: '/us/en/digital-solutions/digital-commerce' },
      { label: 'Inventory Manager', href: '/us/en/digital-solutions/inventory-manager' },
      { label: 'e-Commerce Tools', href: '/us/en/digital-solutions/ecommerce-tools' },
      { label: 'B2B Integration Services', href: '/us/en/digital-solutions/b2b-integration-services' },
      { label: 'Data Informatics', href: '/us/en/digital-solutions/data-informatics' },
      { label: 'Data, Metrics & Analytic Solutions', href: '/us/en/digital-solutions/data-metrics-analytic-lab-solutions' },
      { label: 'Digital Services', href: '/us/en/digital-solutions/digital-services' },
    ],
  },
  {
    label: 'Applications',
    href: '/us/en/applications',
    items: [
      { label: 'View All Applications', href: '/us/en/applications' },
      { label: 'Physical Property Standards', href: '/us/en/applications/quality-control' },
      { label: 'Life Sciences', href: '/us/en/applications/life-sciences' },
      { label: 'Chromatography', href: '/us/en/applications/chromatography' },
      { label: 'Environmental Testing', href: '/us/en/applications/environmental-testing' },
      { label: 'Advanced Technologies & Applied Materials', href: '/us/en/applications/advanced-technologies' },
      { label: 'Semiconductor and MEMS', href: '/us/en/applications/semiconductor-mems' },
      { label: 'Food and Beverage', href: '/us/en/applications/food-beverage' },
      { label: 'Healthcare', href: '/us/en/applications/healthcare' },
      { label: 'Safety', href: '/us/en/applications/safety' },
      { label: 'Featured Solutions', href: '/us/en/applications/featured-solutions' },
      { label: 'Research and Development', href: '/us/en/applications/research-and-development' },
      { label: 'Production', href: '/us/en/applications/production' },
      { label: 'Mining Supplies and Equipment', href: '/us/en/applications/mining' },
      { label: 'Science Education', href: '/us/en/applications/science-education' },
      { label: 'Petrochemical', href: '/us/en/applications/petrochemical' },
      { label: 'Lab Design & Furniture', href: '/us/en/applications/lab-design-furniture' },
      { label: 'Advanced Battery Science & Technology', href: '/us/en/applications/advanced-battery-science' },
    ],
  },
  {
    label: 'Support',
    href: '/us/en/support',
    items: [
      { label: 'View All Support', href: '/us/en/support' },
      { label: 'Customer Service', href: '/us/en/support/customer-service' },
      { label: 'ISO Certifications', href: '/us/en/support/iso-certifications' },
      { label: 'Local Certifications', href: '/us/en/support/local-compliance-certification' },
      { label: 'Promotions', href: '/us/en/support/promotions' },
      { label: 'Support Materials', href: '/us/en/support/support-materials' },
      { label: 'Ask Avantor', href: '/us/en/support/ask-avantor' },
      { label: 'Resources', href: '/us/en/support/resources' },
      { label: 'Grade Definitions', href: '/us/en/support/grade-definitions' },
      { label: 'Literature', href: '/us/en/support/literature' },
      { label: 'Events', href: '/us/en/support/events' },
      { label: 'Webinars', href: '/us/en/support/webinars' },
    ],
  },
];
