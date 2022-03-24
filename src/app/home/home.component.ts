import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  requestBtnPromise = false;
  requestForm: FormGroup;
  settings: any;
  output = [];

  get docNum() {
    return this.requestForm?.get('docNum');
  }

  get scriptName() {
    return this.requestForm?.get('scriptName');
  }

  constructor(
    private electronService: ElectronService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {}

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
    });
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
    };

    await this.electronService.ipcRenderer.invoke(
      'send-request',
      data
    );
  }
}
