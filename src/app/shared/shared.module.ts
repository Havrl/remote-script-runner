import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Angular2PromiseButtonModule } from 'angular2-promise-buttons';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    Angular2PromiseButtonModule.forRoot({
      spinnerTpl:
        '<img src="assets/icons/loading.gif" class="progress-indicator">',
      handleCurrentBtnOnly: true,
    }),
  ],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    ReactiveFormsModule,
    Angular2PromiseButtonModule
  ],
})
export class SharedModule {}
