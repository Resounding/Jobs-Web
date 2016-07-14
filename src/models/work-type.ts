export class WorkType {
    id: string;
    name: string;

    static MATERIALS_AND_INSTALL:string = 'm+i';
    static INSTALL_ONLY:string = 'install';

    static OPTIONS:WorkType[] = [
        { id: WorkType.MATERIALS_AND_INSTALL, name: 'Materials + Install' },
        { id: WorkType.INSTALL_ONLY, name: 'Install Only' }
    ]
}