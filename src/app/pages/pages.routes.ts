import { Routes } from '@angular/router';
import { About } from './about/about';
import { Product } from './product/product';
import { Integrations} from './integrations/integrations';
import { Docs } from './docs/docs';
import { Pricing } from './pricing/pricing';
import { Signin} from './signin/signin';

export const pagesRoutes: Routes = [
  { path: 'about', component: About },
  { path: 'product', component: Product },
  { path: 'integrations', component: Integrations },
  { path: 'docs', component: Docs},
  { path: 'pricing', component: Pricing},
  { path: 'signin', component: Signin}
];