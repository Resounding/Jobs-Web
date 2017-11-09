import {autoinject} from 'aurelia-framework';
import {DialogController, DialogService} from 'aurelia-dialog';
import {JobPhase, JobPhaseDoc} from '../../models/job-phase';
import {IconService} from '../../services/data/icon-service';
import {JobPhaseService} from '../../services/data/job-phase-service';
import {Notifications} from '../../services/notifications';
import { Prompt } from '../controls/prompt';

@autoinject()
export class EditJobPhase {
  el:Element;
  phase:JobPhaseDoc;
  errors:string[] = [];
  icons:string[];

  constructor(private controller:DialogController, private service:JobPhaseService,
    private iconService:IconService, private dialogService:DialogService) { }

  activate(phase:JobPhase | {} = {}) {
    this.phase = new JobPhaseDoc(phase);
    this.icons = this.iconService.getAll();
  }

  attached() {
    $('.dropdown', this.el).dropdown();
  }

  detached() {
    $('.dropdown', this.el).dropdown('destroy');
  }

  async save() {
    try {
      const result = await this.service.save(this.phase);

      if(result.ok) {
        this.controller.ok(this.phase);
      } else {
        this.errors = result.errors;
      }
    } catch(e) {
      Notifications.error(e);
    }
  }

  async delete() {
    try {
      this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this phase?'})
        .then(async promptResult => {
          if(promptResult.wasCancelled) return;

          const result = await this.service.delete(this.phase);

          if(result) {
            this.controller.ok(this.phase);
          } else {
            this.errors = ['There was a problem deleting the phase'];
          }
        });
    } catch(e) {
      Notifications.error(e);
    }
  }
}
