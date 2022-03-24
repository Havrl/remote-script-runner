import { Component, NgZone } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private router: Router,
    private zone: NgZone
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);

      this.electronService.ipcRenderer.on('navigate-to', (event, data) => {
        let route: any;

        switch(data) {
          case 'home':
            route = ['home'];
            break;
          case 'settings':
            route = ['settings'];
            break;
        }

        this.zone.run(() => {
          this.router.navigate(route);
        });

      });

    } else {
      console.log('Run in browser');
    }
  }
}
