import { uniqueId } from '../../../core/utils/common.util';
import { Directive, ElementRef, Inject, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

import { DOCUMENT } from '@angular/common';
import { NgControl } from '@angular/forms';
import { ValidateDirectiveOptions } from './validate-options.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';


/**
 * Validation directive used with reactive forms to decorate the html elements to display validation error messages.
 * If the control is invalid the invalid (cross) icon displays in the right side of the control with
 * the tooltip showing (on hover) the corresponding validation message.
 *
 * @description To enable validation error messages add aeValidate and [validateErrors] attributes.
 * The validateErrors attribute takes the object of errors related to the assigned Validators of
 * the corresponding FormControl.
 * E.g. if a control is assigned the Validators.required, then the validateError attribute
 * would be like that:
 * [validateErrors]="{ 'required': 'Name is required and can not be empty.' }"
 * The key should match assigned Validator type.
 *
 * @example
   <input type="text" class="form-control" id="inputCompanyName" formControlName="companyName"
        [validateErrors]="{ 'required': 'The Company Name is required and can not be empty.',
                            'minLength': 'The company name must be at least 3 characters length.' }"
        aeValidate>
 *
 * @see companies\components\company-settings-form\company-settings-form.component.html
 *
 * @todo Allow the customisation of tooltip's style, position, trigger.
 * The directive will take the optional config object, e.g. [aeValidate]="config"
 * which would initialise the tooltip with the custom configuration.
 */
@UntilDestroy()
@Directive({
  selector: '[aeValidate]'
})
export class ValidateDirective  implements OnInit, OnDestroy {
  @Input() validateErrors: object = {};
  @Input() validateOptions: ValidateDirectiveOptions = {};

  // hold the event listeners for mouse enter / leave on the invalid icon
  hoverListenerFn: () => void;
  unhoverListenerFn: () => void;

  iconOffsetRight = 12; // icons right position (px) from the right side of the parent control
  iconOffsetTop = 20; // icons top position (px) from the top side of the parent control
  elmId: any; // holds the host id

  constructor(
    private el: ElementRef,
    private control: NgControl,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document
  ) {
    this.elmId = this.el.nativeElement.id || uniqueId();
  }

  ngOnInit() {
    // ensure all keys are lowercased
    this.validateErrors = this.keysToLowerCase(this.validateErrors);

    this.control.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.validate();
    });

    if (this.validateOptions.validateOnInit) {
      this.validate();
    }
  }

  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  private validate() {
    // By default, we don't want to run the validation on pristine state
    // E.g. until the control is marked as dirty, no icon would be displayed
    if (!this.validateOptions.validatePristine && this.control.pristine) {
      this.removeIcon('check');
      this.removeIcon('cross');
      return;
    }

    if (this.control.invalid && this.control.dirty) {
      this.insertIcon('cross');
      this.insertTooltip(this.control.errors);
      this.removeIcon('check');
    } else {
      if (!this.validateOptions.hideValid) {
        this.insertIcon('check');
      }
      this.removeIcon('cross');
      this.disposeListeners();
    }
  }

  private getErrorMessage(errors: object) {
    const errorKeys = Object.keys(errors);
    const errorKey = errorKeys[0].toLowerCase();

    // get the first error message in case there are multiple error keys
    const msg = this.validateErrors[errorKey];

    return msg ? msg : `Invalid value`;
  }

  private insertIcon(type: string) {
    if (this.getIcon(type)) {
      return;
    }

    const parent = this.el.nativeElement.parentNode;
    const validationClass = 'has-validation';

    const classList = parent.className.split(' ');
    if (classList.indexOf(validationClass) === -1) {
      parent.className += ` ${validationClass}`;
    }

    this.el.nativeElement.insertAdjacentHTML(
      'afterend',
      `<i id="${this.elmId}-validation-icon-${type}" class="control-validation fa ` +
        `${type === 'check' ? 'fa-check text-success' : 'fa-times invalid-icon text-danger'}" ` +
        `style="${this.validateOptions.style ? this.validateOptions.style : ''}"></i>`
    );

    if (type === 'check') {
      return;
    }

    const targetElm = this.getIcon(type);
    this.hoverListenerFn = this.renderer.listen(targetElm, 'mouseenter', this.showTooltip.bind(this));
    this.unhoverListenerFn = this.renderer.listen(targetElm, 'mouseleave', this.hideTooltip.bind(this));
  }

  private insertTooltip(errors: object) {
    // Ensure the errors object is not null
    if (!errors || Object.keys(errors).length === 0) {
      return;
    }

    const msg = this.getErrorMessage(errors);

    let tooltipElm = this.getTooltip();
    if (!tooltipElm) {
      this.el.nativeElement.insertAdjacentHTML(
        'afterend',
        `<div id="${this.elmId}-tooltip" class="validation-tooltip" style="visibility: hidden">${msg}</div>`
      );

      tooltipElm = this.getTooltip();
    } else {
      // just replace the error msg
      tooltipElm.textContent = msg;
    }

    const tooltipHeight = tooltipElm.offsetHeight;

    const icon = this.getIcon('cross');
    this.iconOffsetTop = icon?.offsetTop;

    const topPos = Math.floor(tooltipHeight) - this.iconOffsetTop;
    const rightPos = (this.el.nativeElement.offsetLeft + this.el.nativeElement.width) || 0;

    tooltipElm.style.right = `${rightPos}px`;
    tooltipElm.style.top = `-${topPos}px`;
  }

  private removeTooltip() {
    const tooltipElm = this.getTooltip();
    if (tooltipElm) {
      tooltipElm.parentNode.removeChild(tooltipElm);
    }
  }

  private removeIcon(type: string) {
    const feedbackIcon = this.getIcon(type);
    if (feedbackIcon) {
      feedbackIcon.parentNode.removeChild(feedbackIcon);
    }

    if (type === 'cross') {
      this.removeTooltip();
    }
  }

  private disposeListeners() {
    if (this.hoverListenerFn) {
      this.hoverListenerFn();
      this.hoverListenerFn = null;
    }

    if (this.unhoverListenerFn) {
      this.unhoverListenerFn();
      this.unhoverListenerFn = null;
    }
  }

  private getIcon(type: string) {
    return this.document.getElementById(`${this.elmId}-validation-icon-${type}`);
  }

  private getTooltip() {
    return this.document.getElementById(`${this.elmId}-tooltip`);
  }

  private showTooltip() {
    const toolTipElm = this.getTooltip();
    if (toolTipElm) {
      toolTipElm.style.visibility = 'visible';
    }
  }

  private hideTooltip() {
    const toolTipElm = this.getTooltip();
    if (toolTipElm) {
      toolTipElm.style.visibility = 'hidden';
    }
  }

  private keysToLowerCase(obj: object) {
    let key: string;
    const keys = Object.keys(obj);
    let n = keys.length;
    const newobj = {};
    while (n--) {
      key = keys[n];
      newobj[key.toLowerCase()] = obj[key];
    }

    return newobj;
  }
}
