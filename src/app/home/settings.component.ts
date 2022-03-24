import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  btnPromise = false;
  settingsForm: FormGroup;
  settings: any = {};
  toast: any;

  get serverName() {
    return this.settingsForm?.get('serverName');
  }

  get scriptsPath() {
    return this.settingsForm?.get('scriptsPath');
  }

  get scripts() {
    return this.settingsForm?.get('scripts');
  }

  constructor(
    private electronService: ElectronService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.electronService.ipcRenderer.on('load-settings-resp', (event, data) => {
      this.settings = data;

      //console.log('settings => loaded', this.settings);

      this.patchForm();
      this.cd.detectChanges();
    });

    this.electronService.ipcRenderer.on(
      'update-settings-resp',
      (event, data) => {
        this.toast = null;

        if (data === 'error') {
          this.toast = { message: 'Failed to update settings.', type: 'error' };
        } else {
          this.toast = { message: 'Settings updated.', type: 'success' };
        }
        this.cd.detectChanges();
      }
    );

    this.electronService.ipcRenderer.send('load-settings');
  }

  initForm() {
    this.settingsForm = this.fb.group({
      serverName: ['', [Validators.required, Validators.maxLength(50)]],
      scriptsPath: ['', Validators.required],
      scripts: ['', Validators.required],
    });
  }

  patchForm() {
    this.settingsForm.patchValue({
      serverName: this.settings.serverName,
      scriptsPath: this.settings.scriptsPath,
      scripts: this.stringifyScripts(this.settings.scripts),
    });
    this.settingsForm.updateValueAndValidity();
  }

  stringifyScripts(scripts: any[]): string {
    return scripts
      .map((script: any) => `${script.name}::${script.desc}`)
      .join('\r\n');
  }

  validateScripts(scripts: string): string[] {
    const errors: string[] = [];
    const arr = scripts.split('\n');

    arr.forEach((entry: string) => {
      if (entry.trim() !== '') {
        const entryArr = entry.split('::');

        if (!this.isEntryValid(entryArr)) {
          errors.push(`Invalid entry: ${entry}`);
        }
      }
    });

    return errors;
  }

  parseScripts(scripts: string) {
    const arr = scripts.split('\n');

    const scriptsArray = [];

    arr.forEach((entry: string) => {
      if (entry.trim() !== '') {
        const entryArr = entry.split('::');

        let parsedEntry: object;
        if (!this.isEntryValid(entryArr)) {
          parsedEntry = { name: 'invalid', desc: 'invalid' };
        } else {
          parsedEntry = { name: entryArr[0], desc: entryArr[1] };
        }

        scriptsArray.push(parsedEntry);
      }
    });

    return scriptsArray;
  }

  isEntryValid(entryArr: any[]): boolean {
    return entryArr.length === 2;
  }

  resetToDefaul() {}

  save() {
    this.toast = null;
    this.btnPromise = true;

    const formModel = this.settingsForm.value;

    const errors = this.validateScripts(formModel.scripts);
    if (errors.length > 0) {
      this.toast = { message: errors.join('; '), type: 'error' };
      return;
    }

    const scripts = this.parseScripts(formModel.scripts);

    const data = {
      serverName: formModel.serverName,
      scriptsPath: formModel.scriptsPath,
      scripts: scripts,
    };

    console.log('save settings', data);

    this.electronService.ipcRenderer.send('update-settings', data);
    this.btnPromise = false;
  }

  deleteToast() {
    this.toast = null;
    this.cd.detectChanges();
  }
}
