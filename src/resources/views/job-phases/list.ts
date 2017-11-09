import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogResult, DialogService} from 'aurelia-dialog';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import * as $ from 'jquery';
import * as Sortable from 'sortablejs';
import * as _ from 'underscore';
import {EditJobPhase} from './edit';
import {JobPhase, JobPhaseDoc} from '../../models/job-phase';
import {Database} from '../../services/data/db'
import {JobPhaseService} from '../../services/data/job-phase-service';
import {Notifications} from '../../services/notifications';
import { ValidationResult } from '../../models/validation';


@autoinject
export class JobPhaseList {
    el:Element;
    phases:JobPhase[];
    syncChangeSubscription:Subscription;

    constructor(private service:JobPhaseService, private dialogService:DialogService, private events: EventAggregator) { }

    async attached() {
        const list = $('.divided.list', this.el).get(0);
        Sortable.create(list, {
            onEnd: this.onSortableEnd.bind(this),
            handle: '.circular.icon'
        });

        this.syncChangeSubscription = this.events.subscribe(Database.SyncChangeEvent, this.refresh.bind(this));

        await this.refresh();
    }

    async refresh() {
        try {

            const phases = await this.service.getAll();
            this.phases = _.sortBy(phases, p => p.sortOrder);

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

                const message = result.output ? 'Phase saved successfully' : 'Phase deleted successfully';
                Notifications.success(message);

                this.refresh();
            })
            .catch(Notifications.error);
    }

    async onSortableEnd() {
        const saves:Promise<ValidationResult>[] = [];
        $('.divided.list .item', this.el).each((i, el) => {
            const id = $(el).data('id'),
                phase = this.phases.find(p => p._id === id);
                
            if(phase) {
                const doc = new JobPhaseDoc(phase);
                doc.sortOrder = i;
                saves.push(this.service.save(doc));
            }
        });
        return await Promise.all(saves);
    }
}