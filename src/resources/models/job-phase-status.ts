import {JobPhase} from "./job-phase";

export interface JobPhaseStatus {
    phase:JobPhase;
    status:JobPhaseStatuses | null;
}

export enum JobPhaseStatuses {
    NOT_STARTED = 'not started',
    PARTIAL = 'partial',
    COMPLETE = 'complete',
    NOT_APPLICABLE = 'n/a'
}