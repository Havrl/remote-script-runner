import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  requestBtnPromise = false;
  requestForm: FormGroup;
  settings: any;
  output = [];
  subs: Subscription[] = [];

  get docNum() {
    return this.requestForm?.get('docNum');
  }

  get scriptName() {
    return this.requestForm?.get('scriptName');
  }

  get username() {
    return this.requestForm?.get('username');
  }

  get password() {
    return this.requestForm?.get('password');
  }

  constructor(
    private electronService: ElectronService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {

    this.initForm();

    this.electronService.ipcRenderer.on('cmd-output', (event, data) => {
      this.output.push(data);
      this.requestBtnPromise = false;
      this.cd.detectChanges();
    });

    this.electronService.ipcRenderer.on('load-settings-resp', (event, data) => {
      this.settings = data;

      this.cd.detectChanges();
      console.log('home -> settings', this.settings);
    });

    this.electronService.ipcRenderer.send('load-settings');

  }

  initForm() {
    this.requestForm = this.fb.group({
      docNum: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.maxLength(6),
        ],
      ],
      scriptName: [null, Validators.required],
      username: '',
      password: '',
      withCredentials: ''
    });

    this.subs.push(this.requestForm.get('withCredentials').valueChanges.subscribe(value => {
      this.toggleDisable(!value);
    }));

    this.toggleDisable(true);
  }

  toggleDisable(isDisabled: boolean) {
    if (isDisabled) {
      this.username.disable({ onlySelf: true, emitEvent: false });
      this.username.setValue(null);
      this.password.disable({ onlySelf: true, emitEvent: false });
      this.password.setValue(null);
    } else {
      this.username.enable({ onlySelf: true, emitEvent: false });
      this.password.enable({ onlySelf: true, emitEvent: false });
    }

    this.username.setValidators(!isDisabled ? Validators.required : null);
    this.password.setValidators(!isDisabled ? Validators.required : null);
    this.username.updateValueAndValidity();
    this.password.updateValueAndValidity();
    this.requestForm.updateValueAndValidity();
  }

  clearOutput() {
    this.output = [];
  }


  async sendRequest() {

    this.requestBtnPromise = true;

    this.clearOutput();

    const formModel = this.requestForm.value;
    const data = {
      docNum: formModel.docNum,
      script: formModel.scriptName,
      username: formModel.withCredentials ? formModel.username : '',
      password: formModel.withCredentials ? formModel.password : ''
    };

    // console.log('sendRequest', data);

    await this.electronService.ipcRenderer.invoke(
      'send-request',
      data
    );
  }
}
