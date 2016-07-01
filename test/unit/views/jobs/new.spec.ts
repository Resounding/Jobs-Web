import {NewJob} from '../../../../src/views/jobs/new';

describe('the New Job module', () => {
   var sut;

    beforeEach(() => {
        sut = new NewJob();
    });

    it('contains a job property', () => {
        expect(sut.job).toBeDefined();
    });
});