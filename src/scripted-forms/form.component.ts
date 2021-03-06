import {
  Component, OnInit, AfterViewInit,
  ViewChild, ViewContainerRef, ComponentRef,
  Compiler, ComponentFactory, NgModule,
  ModuleWithComponentFactories, ViewChildren, QueryList,
  ElementRef
  // ChangeDetectorRef, OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';

import * as  MarkdownIt from 'markdown-it';

import { ScriptedFormElementsModule } from './scripted-form-elements.module';
import { KernelService } from './kernel.service';
import { StartComponent } from './start.component';
import { VariableComponent } from './variable.component';
import { LiveComponent } from './live.component';
import { ButtonComponent } from './button.component';

import {
  PromiseDelegate
} from '@phosphor/coreutils';

interface IRuntimeComponent {
  initialiseForm: Function;
}

@Component({
  selector: 'app-form',
  template: `<div #errorbox class="errorbox"></div><div #container></div>`
})
export class FormComponent implements OnInit, AfterViewInit {
  myMarkdownIt: MarkdownIt.MarkdownIt;
  viewInitialised = new PromiseDelegate<void>();

  @ViewChild('errorbox') errorbox: ElementRef
  @ViewChild('container', { read: ViewContainerRef })
  container: ViewContainerRef;

  errorboxDiv: HTMLDivElement;

  private componentRef: ComponentRef<IRuntimeComponent>;

  constructor(
    private compiler: Compiler
  ) { }

  ngOnInit() {
    this.myMarkdownIt = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  ngAfterViewInit() {
    this.errorboxDiv = this.errorbox.nativeElement;
    this.viewInitialised.resolve(undefined);
  }

  setFormContents(form: string) {
    this.viewInitialised.promise.then(() => {
      this.buildForm(form);
    })
  }

  buildForm(form: string) {
    const customTags = form.replace(/\[start\]/g, '\n<form-start>\n'
    ).replace(/\[\/start\]/g, '\n</form-start>\n'
    ).replace(/\[live\]/g, '\n<form-live>\n'
    ).replace(/\[\/live\]/g, '\n</form-live>\n'
    ).replace(/\[button\]/g, '\n<form-button>\n'
    ).replace(/\[\/button\]/g, '\n</form-button>\n'
    ).replace(/\[number\]/g, '<form-variable type="number">'
    ).replace(/\[\/number\]/g, '</form-variable>'
    ).replace(/\[string\]/g, '<form-variable type="string">'
    ).replace(/\[\/string\]/g, '</form-variable>');

    const html = this.myMarkdownIt.render(customTags);
    const escapedHtml = html.replace(/{/g, '@~lb~@'
    ).replace(/}/g, '@~rb~@'
    ).replace(/@~lb~@/g, '{{ "{" }}'
    ).replace(/@~rb~@/g, '{{ "}" }}');

    this.compileTemplate(escapedHtml)
  }

  compileTemplate(template: string) {
    console.assert(template != null)
    
    const metadata = {
      selector: `app-runtime`,
      template: template
    };

    const factory = this.createComponentFactory(
      this.compiler, metadata, null);
    
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    this.errorboxDiv.innerHTML = '';
    this.componentRef = this.container.createComponent(factory);

    console.log(this.componentRef)
  }

  private createComponentFactory(compiler: Compiler, metadata: Component,
                                 componentClass: any): ComponentFactory<any> {
    @Component(metadata)
    class RuntimeComponent implements AfterViewInit {
      formActivation = false;

      @ViewChildren(StartComponent) startComponents: QueryList<StartComponent>
      @ViewChildren(VariableComponent) variableComponents: QueryList<VariableComponent>
      @ViewChildren(LiveComponent) liveComponents: QueryList<LiveComponent>
      @ViewChildren(ButtonComponent) buttonComponents: QueryList<ButtonComponent>

      constructor(
        private myKernelSevice: KernelService
      ) { }

      ngAfterViewInit() {
        this.initialiseForm()
      }

      initialiseForm() {
        if (this.formActivation === false) {
          this.formActivation = true;

          this.myKernelSevice.sessionConnected.promise.then(() => {

            console.log('session connected');
            console.log(this.startComponents);

            // The order here forces all import components to run first.
            // Only then will the variable component fetch the variables.
            this.startComponents.toArray().forEach((startComponent, index) => {
              startComponent.setId(index);
              if (this.myKernelSevice.isNewSession) {
                startComponent.runCode();
              }
            });
            this.myKernelSevice.isNewSession = false;

            for (const variableComponent of this.variableComponents.toArray()) {
              variableComponent.fetchVariable();
            }
            this.myKernelSevice.queue.then(() => {
              this.liveComponents.toArray().forEach((liveComponent, index) => {
                liveComponent.setId(index);
                liveComponent.formReady();
              });

              for (const variableComponent of this.variableComponents.toArray()) {
                variableComponent.formReady();
              }
              this.buttonComponents.toArray().forEach((buttonComponent, index) => {
                buttonComponent.setId(index);
                buttonComponent.formReady();
              });
            });
          })
        }
      }
    };

    @NgModule(
      {
        imports: [
          CommonModule,
          ScriptedFormElementsModule
        ],
        declarations: [
          RuntimeComponent
        ]
      }
    )
    class RuntimeComponentModule { }
    
    const module: ModuleWithComponentFactories<any> = (
      compiler.compileModuleAndAllComponentsSync(RuntimeComponentModule));
    return module.componentFactories.find(
      f => f.componentType === RuntimeComponent);
  }
}
