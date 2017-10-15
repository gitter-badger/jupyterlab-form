import {
  AngularWidget
} from './angular-loader';

import {
  AppComponent
} from './app.component';
  
import {
  AppModule
} from './app.module';

// import {
//   PromiseDelegate
// } from '@phosphor/coreutils';

import {
  ServiceManager
} from '@jupyterlab/services';

import {
  ActivityMonitor, 
  PathExt
} from '@jupyterlab/coreutils';

import {
  ABCWidgetFactory, DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  Message
} from '@phosphor/messaging';

const RENDER_TIMEOUT = 1000;


export
class FormWidget extends AngularWidget<AppComponent, AppModule> implements DocumentRegistry.IReadyWidget {
  private _context: DocumentRegistry.Context;
  private _services: ServiceManager;
  private _monitor: ActivityMonitor<any, any> | null = null;
  waitingForForm = false;

  constructor(options: FormWidget.IOptions) {
    super(AppComponent, AppModule);

    this.id = '@simonbiggs/jupyterlab-form';
    this.title.closable = true;
    this.addClass('jp-scriptedFormWidget');

    this._context = options.context;
    this._services = options.services;

    this.componentReady.promise.then(() => {
      this.componentInstance.setServices(this._services);
      this.componentInstance.setPath(this._context.path);
      this.componentInstance.sessionConnect();
    })

    this.title.label = PathExt.basename(this._context.path);
    this._context.pathChanged.connect(this._onPathChanged, this);

    this._context.ready.then(() => {
      this.updateFormContents()
      this._monitor = new ActivityMonitor({
        signal: this._context.model.contentChanged,
        timeout: RENDER_TIMEOUT
      });
      this._monitor.activityStopped.connect(this.updateFormContents, this);
    })
  }

  updateFormContents() {
    // this.formReady = false;
    let content = this._context.model.toString();
    this.componentReady.promise.then(() => {
      // if (!this.waitingForForm) {
      //   this.componentRef.instance.setFormContents(content)
      //   this.waitingForForm = true;
      //   this.componentRef.instance.formReady.promise.then(() => {
      //     this.waitingForForm = false;
      //   })
      // }
      this.componentRef.instance.setFormContents(content);
    })
  }

  get context(): DocumentRegistry.Context {
    return this._context;
  }

  get ready() {
    return Promise.resolve();
  }

  dispose(): void {
    if (this._monitor) {
      this._monitor.dispose();
    }
    this.componentRef.destroy();
    super.dispose();
  }

  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }

  private _onPathChanged(): void {
    this.title.label = PathExt.basename(this._context.path);
    this.componentInstance.pathChanged(this._context.path);
  }
}

export
namespace FormWidget {
  export
  interface IOptions {
    context: DocumentRegistry.Context,
    services: ServiceManager
  }
}

export
namespace FormWidgetFactory {
  export
  interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    services: ServiceManager
  }
}

export
class FormWidgetFactory extends ABCWidgetFactory<FormWidget, DocumentRegistry.IModel> {
  services: ServiceManager

  constructor(options: FormWidgetFactory.IOptions) {
    super(options);
    this.services = options.services;
  }

  protected createNewWidget(context: DocumentRegistry.Context): FormWidget {
    return new FormWidget({
      context: context, 
      services: this.services 
    });
  }
}