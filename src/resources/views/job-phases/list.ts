import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogResult, DialogService} from 'aurelia-dialog';
import {EditJobPhase} from './edit';
import {Prompt} from '../controls/prompt';
import {JobPhase} from '../../models/job-phase';
import {JobPhaseService} from '../../services/data/job-phase-service';
import {Notifications} from '../../services/notifications';


@autoinject
export class JobPhaseList {
    phases:JobPhase[];

    constructor(private service:JobPhaseService, private dialogService:DialogService) { }

    async attached() {
        await this.refresh();
    }

    async refresh() {
        try {

            this.phases = await this.service.getAll();

        } catch(e) {
            Notifications.error(e);
        }
    }

    new() {
        this.dialogService.open({ viewModel: EditJobPhase})
            .then(result => {
                if(result.wasCancelled) return;

                Notifications.success('Job Phase saved successfully');
                this.refresh();
            })
            .catch(Notifications.error);
    }

    edit(phase:JobPhase) {
        this.dialogService.open({ viewModel: EditJobPhase, model: phase })
            .then(result => {
                if(result.wasCancelled) return;

                Notifications.success('Job Phase saved successfully');
                this.refresh();
            })
            .catch(Notifications.error);
    }
}