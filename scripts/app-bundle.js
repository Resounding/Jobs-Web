define('environment',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        debug: true,
        testing: true
    };
});

define('resources/services/config',["require", "exports"], function (require, exports) {
    "use strict";
    var Configuration = (function () {
        function Configuration() {
            this.app_database_name = 'LangendoenJobs';
            this.app_root = 'resources/views/app';
            this.login_root = 'resources/views/login';
            this.remote_server = 'https://resounding.cloudant.com';
            this.remote_database_name = Configuration.isDebug() ? this.remote_server + "/langendoen-test" : this.remote_server + "/langendoen";
        }
        Configuration.isDebug = function () {
            return window.location.hostname === 'localhost';
        };
        return Configuration;
    }());
    exports.Configuration = Configuration;
});

define('resources/services/log',["require", "exports", 'aurelia-framework'], function (require, exports, aurelia_framework_1) {
    "use strict";
    exports.log = aurelia_framework_1.LogManager.getLogger('jobsweb');
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/services/auth',["require", "exports", 'aurelia-framework', 'aurelia-event-aggregator', 'aurelia-router', 'aurelia-fetch-client', './config', './log'], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, aurelia_router_1, aurelia_fetch_client_1, config_1, log_1) {
    "use strict";
    var storage_key = 'auth_token';
    var database = null;
    var user_info = null;
    var Authentication = (function () {
        function Authentication(app, config, router, httpClient, events) {
            this.app = app;
            this.config = config;
            this.router = router;
            this.httpClient = httpClient;
            this.events = events;
            database = new PouchDB(this.config.remote_database_name, { skip_setup: true });
            user_info = JSON.parse(localStorage[storage_key] || null);
        }
        Authentication.prototype.login = function (user, password) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var url = _this.config.remote_server + "/_session", body = "name=" + encodeURI(user) + "&password=" + encodeURI(password), authHeader = "Basic " + window.btoa(user + password);
                _this.httpClient.fetch(url, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: authHeader },
                    method: 'post',
                    body: body
                })
                    .then(function (result) {
                    if (result.ok) {
                        log_1.log.debug('Login succeeded');
                        result.json().then(function (info) {
                            user_info = {
                                name: info.name,
                                password: password,
                                roles: info.roles,
                                basicAuth: authHeader
                            };
                            localStorage[storage_key] = JSON.stringify(user_info);
                            _this.app.setRoot(_this.config.app_root);
                            _this.events.publish(Authentication.AuthenticatedEvent);
                            return resolve(user_info);
                        });
                    }
                    else {
                        log_1.log.debug('Login failed');
                        result.json().then(function (error) {
                            reject(new Error("Login failed: " + error.reason));
                        });
                    }
                })
                    .catch(reject);
            });
        };
        Authentication.prototype.logout = function () {
            user_info = null;
            localStorage[storage_key] = null;
            this.app.setRoot(this.config.login_root);
            this.router.navigateToRoute('login');
            return Promise.resolve();
        };
        Authentication.prototype.isAuthenticated = function () {
            return user_info !== null;
        };
        Authentication.prototype.isInRole = function (role) {
            return this.isAuthenticated() && user_info.roles.indexOf(role) !== -1;
        };
        Authentication.prototype.userInfo = function () {
            return user_info;
        };
        Authentication.isLoggedIn = function () {
            return user_info !== null;
        };
        Authentication.AuthenticatedEvent = 'authenticated';
        Authentication = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [aurelia_framework_1.Aurelia, config_1.Configuration, aurelia_router_1.Router, aurelia_fetch_client_1.HttpClient, aurelia_event_aggregator_1.EventAggregator])
        ], Authentication);
        return Authentication;
    }());
    exports.Authentication = Authentication;
    var AuthorizeStep = (function () {
        function AuthorizeStep() {
        }
        AuthorizeStep.prototype.run = function (navigationInstruction, next) {
            if (navigationInstruction.getAllInstructions().some(function (i) { return i.config.auth; })) {
                var loggedIn = Authentication.isLoggedIn();
                if (!loggedIn) {
                    return next.cancel(new aurelia_router_1.Redirect('login'));
                }
            }
            return next();
        };
        return AuthorizeStep;
    }());
    exports.AuthorizeStep = AuthorizeStep;
    var Roles = (function () {
        function Roles() {
        }
        Roles.Foreman = 'foreman';
        Roles.Administrator = 'administrator';
        Roles.Owner = 'owner';
        Roles.OfficeAdmin = 'office_admin';
        return Roles;
    }());
    exports.Roles = Roles;
});

define('main',["require", "exports", './resources/services/auth', './resources/services/config'], function (require, exports, auth_1, config_1) {
    "use strict";
    Promise.config({
        warnings: {
            wForgottenReturn: false
        }
    });
    function configure(aurelia) {
        aurelia.use
            .standardConfiguration()
            .feature('resources');
        if (config_1.Configuration.isDebug()) {
            aurelia.use.developmentLogging();
        }
        return aurelia.start().then(function () {
            var auth = aurelia.container.get(auth_1.Authentication), config = aurelia.container.get(config_1.Configuration), root = auth.isAuthenticated() ? config.app_root : config.login_root;
            return aurelia.setRoot(root);
        });
    }
    exports.configure = configure;
});

define('resources/index',["require", "exports"], function (require, exports) {
    "use strict";
    function configure(config) {
    }
    exports.configure = configure;
});

define('resources/models/billing-type',["require", "exports"], function (require, exports) {
    "use strict";
    var BillingType = (function () {
        function BillingType() {
        }
        BillingType.TIME_AND_MATERIALS = 't+m';
        BillingType.FIXED_CONTRACT = 'time';
        BillingType.OPTIONS = [
            { id: BillingType.TIME_AND_MATERIALS, name: 'Time and Materials' },
            { id: BillingType.FIXED_CONTRACT, name: 'Fixed/Contract' }
        ];
        return BillingType;
    }());
    exports.BillingType = BillingType;
});

define('resources/models/customer',["require", "exports"], function (require, exports) {
    "use strict";
    var CustomerDocument = (function () {
        function CustomerDocument(props) {
            if (props) {
                _.extend(this, props);
            }
        }
        CustomerDocument.prototype.toJSON = function () {
            return {
                _id: this._id,
                _rev: this._rev,
                type: CustomerDocument.DOCUMENT_TYPE,
                name: this.name
            };
        };
        CustomerDocument.createId = function (name) {
            return CustomerDocument.DOCUMENT_TYPE + ":" + name.toLowerCase().replace(' ', '-');
        };
        CustomerDocument.DOCUMENT_TYPE = 'customer';
        return CustomerDocument;
    }());
    exports.CustomerDocument = CustomerDocument;
});

define('resources/models/foreman',["require", "exports"], function (require, exports) {
    "use strict";
    var Foreman = (function () {
        function Foreman() {
        }
        Foreman.OPTIONS = [
            'Barry',
            'Dan',
            'Kurt'
        ];
        return Foreman;
    }());
    exports.Foreman = Foreman;
});

define('resources/models/job-status',["require", "exports"], function (require, exports) {
    "use strict";
    var JobStatus = (function () {
        function JobStatus() {
        }
        JobStatus.PENDING = 'pending';
        JobStatus.IN_PROGRESS = 'inprogress';
        JobStatus.COMPLETE = 'complete';
        JobStatus.CLOSED = 'closed';
        JobStatus.OPTIONS = [
            { id: JobStatus.PENDING, name: 'Pending', cssClass: 'hourglass start inverted blue' },
            { id: JobStatus.IN_PROGRESS, name: 'In Progress', cssClass: 'hourglass half inverted green' },
            { id: JobStatus.COMPLETE, name: 'Complete', cssClass: 'hourglass end' },
            { id: JobStatus.CLOSED, name: 'Closed', cssClass: '' }
        ];
        return JobStatus;
    }());
    exports.JobStatus = JobStatus;
});

define('resources/models/job-type',["require", "exports"], function (require, exports) {
    "use strict";
    var JobType = (function () {
        function JobType() {
        }
        JobType.PROJECT = 'project';
        JobType.SERVICE_CALL = 'service';
        JobType.OPTIONS = [
            { id: JobType.PROJECT, name: 'Project' },
            { id: JobType.SERVICE_CALL, name: 'Service Call' }
        ];
        return JobType;
    }());
    exports.JobType = JobType;
});

define('resources/models/job',["require", "exports", './job-status', './job-type'], function (require, exports, job_status_1, job_type_1) {
    "use strict";
    var JobDocument = (function () {
        function JobDocument(props) {
            this._id = null;
            this.job_type = job_type_1.JobType.SERVICE_CALL;
            this.number = null;
            this.name = '';
            this.customer = null;
            this.status = job_status_1.JobStatus.PENDING;
            this.description = '';
            this.isMultiDay = false;
            this.days = 1;
            this.startDate = null;
            this.notes = '';
            this.deleted = false;
            if (props) {
                _.extend(this, props);
            }
        }
        JobDocument.prototype.toJSON = function () {
            return {
                _id: this._id,
                job_type: this.job_type,
                number: this.number,
                name: this.name,
                customer: this.customer,
                status: this.status,
                description: this.description,
                billing_type: this.billing_type,
                work_type: this.work_type,
                isMultiDay: this.isMultiDay,
                days: this.days,
                startDate: this.startDate,
                foreman: this.foreman,
                notes: this.notes,
                manHours: this.manHours,
                deleted: this.deleted,
                type: JobDocument.DOCUMENT_TYPE,
                _rev: this._rev
            };
        };
        JobDocument.DOCUMENT_TYPE = 'job';
        return JobDocument;
    }());
    exports.JobDocument = JobDocument;
});

define('resources/models/work-type',["require", "exports"], function (require, exports) {
    "use strict";
    var WorkType = (function () {
        function WorkType() {
        }
        WorkType.MATERIALS_AND_INSTALL = 'm+i';
        WorkType.INSTALL_ONLY = 'install';
        WorkType.MATERIALS_ONLY = 'materials';
        WorkType.OPTIONS = [
            { id: WorkType.MATERIALS_AND_INSTALL, name: 'Materials + Install' },
            { id: WorkType.INSTALL_ONLY, name: 'Install Only' },
            { id: WorkType.MATERIALS_ONLY, name: 'Materials Only' }
        ];
        return WorkType;
    }());
    exports.WorkType = WorkType;
});

define('resources/services/notifications',["require", "exports"], function (require, exports) {
    "use strict";
    toastr.options.positionClass = "toast-bottom-left";
    var Notifications = (function () {
        function Notifications() {
        }
        Notifications.success = function (message) {
            toastr.success(message);
        };
        Notifications.error = function (err) {
            toastr.error(JSON.stringify(err));
        };
        return Notifications;
    }());
    exports.Notifications = Notifications;
});

define('resources/services/utils',["require", "exports"], function (require, exports) {
    "use strict";
    var device = undefined;
    function isDevice() {
        if (typeof device === 'undefined') {
            var el = $('<div class="hide-mobile"></div>');
            el.appendTo(document.documentElement);
            device = !el.is(':visible');
            el.remove();
        }
        return device;
    }
    exports.isDevice = isDevice;
});

define('resources/views/app',["require", "exports", '../services/auth'], function (require, exports, auth_1) {
    "use strict";
    var App = (function () {
        function App() {
        }
        App.prototype.configureRouter = function (config, router) {
            config.addPipelineStep('authorize', auth_1.AuthorizeStep);
            config.title = 'Langendoen Mechanical Job Management Application';
            config.map([
                { route: ['', 'jobs'], name: 'jobs.list', moduleId: 'resources/views/jobs/list', title: 'Jobs List', nav: true, auth: true },
                { route: 'jobs/new', name: 'jobs.new', moduleId: 'resources/views/jobs/detail', title: 'New Job', nav: true, auth: true },
                { route: 'jobs/:id', name: 'jobs.edit', moduleId: 'resources/views/jobs/detail', title: 'Edit Job', auth: true }
            ]);
            this.router = router;
        };
        return App;
    }());
    exports.App = App;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/login',["require", "exports", 'aurelia-framework', '../services/auth'], function (require, exports, aurelia_framework_1, auth_1) {
    "use strict";
    var Login = (function () {
        function Login(auth) {
            this.auth = auth;
        }
        Login.prototype.login = function () {
            var _this = this;
            this.errorMessage = '';
            if (!this.password)
                this.errorMessage = 'Please enter your password';
            if (!this.username)
                this.errorMessage = 'Please enter your username';
            if (!this.errorMessage) {
                this.auth.login(this.username, this.password)
                    .catch(function (err) {
                    _this.errorMessage = err.message;
                });
            }
        };
        Login = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [auth_1.Authentication])
        ], Login);
        return Login;
    }());
    exports.Login = Login;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/services/data/db',["require", "exports", 'aurelia-event-aggregator', 'aurelia-framework', '../../models/job', '../config', '../log', '../auth'], function (require, exports, aurelia_event_aggregator_1, aurelia_framework_1, job_1, config_1, log_1, auth_1) {
    "use strict";
    var localDB = null;
    var remoteDB = null;
    var Database = (function () {
        function Database(auth, config, events) {
            this.auth = auth;
            this.config = config;
            this.events = events;
            this.init();
            this.events.subscribe(auth_1.Authentication.AuthenticatedEvent, this.init.bind(this));
        }
        Database.prototype.init = function () {
            var _this = this;
            if (localDB === null) {
                localDB = new PouchDB(this.config.app_database_name);
            }
            if (this.auth.isAuthenticated()) {
                var userInfo = this.auth.userInfo(), headers = { Authorization: userInfo.basicAuth };
                remoteDB = new PouchDB(this.config.remote_database_name, {
                    skip_setup: true,
                    auth: { username: userInfo.name, password: userInfo.password }
                });
                localDB.sync(remoteDB, { live: true })
                    .on('complete', function () {
                    log_1.log.debug('Sync complete');
                })
                    .on('error', function (err) {
                    log_1.log.error('Sync error');
                    log_1.log.error(err);
                })
                    .on('change', function (change) {
                    log_1.log.info('Sync change');
                    log_1.log.debug(change);
                    if (change.direction === 'pull') {
                        if (_.isArray(change.change.docs)) {
                            change.change.docs.forEach(function (doc) {
                                if (doc.type === job_1.JobDocument.DOCUMENT_TYPE) {
                                    var job = new job_1.JobDocument(doc);
                                    _this.events.publish(Database.SyncChangeEvent, job);
                                }
                            });
                        }
                    }
                }).on('paused', function (info) {
                    log_1.log.info('Sync pause');
                    log_1.log.debug(info);
                }).on('active', function (info) {
                    log_1.log.info('Sync active');
                    log_1.log.debug(info);
                });
            }
        };
        Database.prototype.destroy = function () {
            return localDB.destroy()
                .then(this.init.bind(this));
        };
        Database.prototype.nextJobNumber = function () {
            return new Promise(function (resolve, reject) {
                localDB.find({
                    selector: { type: job_1.JobDocument.DOCUMENT_TYPE },
                    fields: ['number']
                })
                    .then(function (rows) {
                    log_1.log.debug(rows);
                    var nextNumber = rows.docs.reduce(function (memo, job) {
                        var number = parseInt(job.number);
                        if (!isNaN(number) && number > memo)
                            memo = number;
                        return memo;
                    }, 0) + 1;
                    var formattedNumber = nextNumber < 99999 ? ("0000" + nextNumber).slice(-5) : nextNumber.toString();
                    resolve(formattedNumber);
                })
                    .catch(reject);
            });
        };
        Object.defineProperty(Database.prototype, "db", {
            get: function () {
                return localDB;
            },
            enumerable: true,
            configurable: true
        });
        Database.SyncChangeEvent = 'SyncChangeEvent';
        Database = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [auth_1.Authentication, config_1.Configuration, aurelia_event_aggregator_1.EventAggregator])
        ], Database);
        return Database;
    }());
    exports.Database = Database;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/services/data/activities-service',["require", "exports", 'aurelia-framework', './db'], function (require, exports, aurelia_framework_1, db_1) {
    "use strict";
    var ActivitiesService = (function () {
        function ActivitiesService(database) {
            this.db = database.db;
        }
        ActivitiesService.prototype.getAll = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.db.get('activities')
                    .then(function (result) {
                    resolve(result.items);
                })
                    .catch(function (err) {
                    if (err.status === 404) {
                        var activities = {
                            _id: 'activities',
                            items: []
                        };
                        _this.db.put(activities)
                            .then(function () { return resolve([]); })
                            .catch(reject);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        };
        ActivitiesService.prototype.create = function (activity) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.db.get('activities')
                    .then(function (result) {
                    result.items.push(activity);
                    return _this.db.put(result);
                })
                    .catch(function (err) {
                    if (err.status === 404) {
                        var activities = {
                            _id: 'activities',
                            items: [activity]
                        };
                        return _this.db.put(activities);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        };
        ActivitiesService = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [db_1.Database])
        ], ActivitiesService);
        return ActivitiesService;
    }());
    exports.ActivitiesService = ActivitiesService;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/services/data/customer-service',["require", "exports", 'aurelia-framework', './db', "../../models/customer"], function (require, exports, aurelia_framework_1, db_1, customer_1) {
    "use strict";
    var CustomerService = (function () {
        function CustomerService(database) {
            this.db = database.db;
        }
        CustomerService.prototype.getAll = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.db.find({ selector: { type: customer_1.CustomerDocument.DOCUMENT_TYPE } })
                    .then(function (items) {
                    var customers = items.docs.map(function (item) {
                        var customer = new customer_1.CustomerDocument(item);
                        return customer;
                    });
                    resolve(customers);
                })
                    .catch(reject);
            });
        };
        CustomerService.prototype.create = function (customer) {
            var _this = this;
            if (!customer._id) {
                customer._id = customer_1.CustomerDocument.createId(customer.name);
            }
            return new Promise(function (resolve, reject) {
                return _this.db.put(customer)
                    .then(function (result) {
                    var customer = new customer_1.CustomerDocument(customer);
                    customer._id = result.id;
                    customer._rev = result.rev;
                    resolve(customer);
                })
                    .catch(reject);
            });
        };
        CustomerService = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [db_1.Database])
        ], CustomerService);
        return CustomerService;
    }());
    exports.CustomerService = CustomerService;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/services/data/job-service',["require", "exports", 'aurelia-framework', '../log', './db', '../auth', "../../models/job"], function (require, exports, aurelia_framework_1, log_1, db_1, auth_1, job_1) {
    "use strict";
    var JobService = (function () {
        function JobService(auth, database) {
            this.auth = auth;
            this.database = database;
            this.db = database.db;
        }
        JobService.prototype.getAll = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.db.find({ selector: { type: job_1.JobDocument.DOCUMENT_TYPE } })
                    .then(function (items) {
                    var jobs = items.docs
                        .filter(function (item) { return !item.deleted; });
                    jobs.forEach(function (item) {
                        var job = new job_1.JobDocument(item);
                        if (_.isString(item.startDate)) {
                            job.startDate = moment(item.startDate).toDate();
                        }
                    });
                    resolve(jobs);
                })
                    .catch(reject);
            });
        };
        JobService.prototype.getOne = function (id) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.db.get(id)
                    .then(function (doc) {
                    log_1.log.info(doc);
                    var job = new job_1.JobDocument(doc);
                    if (_.isString(doc.startDate)) {
                        job.startDate = moment(doc.startDate).toDate();
                    }
                    resolve(job);
                })
                    .catch(reject);
            });
        };
        JobService.prototype.save = function (job) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (!job._id) {
                    _this.database.nextJobNumber()
                        .then(function (number) {
                        job._id = "job:" + number;
                        job.number = number;
                        if (_this.auth.isInRole(auth_1.Roles.Foreman)) {
                            job.foreman = _this.auth.userInfo().name;
                        }
                        return _this.db.put(job)
                            .then(resolve)
                            .catch(reject);
                    });
                }
                else {
                    return _this.db.put(job)
                        .then(resolve)
                        .catch(reject);
                }
            });
        };
        JobService.prototype.delete = function (job) {
            job.deleted = true;
            return this.db.put(job);
        };
        JobService.prototype.destroy = function () {
            return this.database.destroy();
        };
        JobService = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [auth_1.Authentication, db_1.Database])
        ], JobService);
        return JobService;
    }());
    exports.JobService = JobService;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/controls/nav-bar',["require", "exports", 'aurelia-framework', 'aurelia-router', '../../services/auth'], function (require, exports, aurelia_framework_1, aurelia_router_1, auth_1) {
    "use strict";
    var NavBar = (function () {
        function NavBar(element, auth) {
            this.element = element;
            this.auth = auth;
        }
        NavBar.prototype.attached = function () {
            $('.dropdown', this.element).dropdown();
        };
        NavBar.prototype.detached = function () {
            $('.dropdown', this.element).dropdown('destroy');
        };
        NavBar.prototype.logout = function () {
            this.auth.logout();
        };
        Object.defineProperty(NavBar.prototype, "userName", {
            get: function () {
                return (this.auth.userInfo() || {}).name;
            },
            enumerable: true,
            configurable: true
        });
        __decorate([
            aurelia_framework_1.bindable, 
            __metadata('design:type', aurelia_router_1.Router)
        ], NavBar.prototype, "router", void 0);
        NavBar = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [Element, auth_1.Authentication])
        ], NavBar);
        return NavBar;
    }());
    exports.NavBar = NavBar;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/jobs/close-job',["require", "exports", 'aurelia-framework'], function (require, exports, aurelia_framework_1) {
    "use strict";
    var CloseJobArgs = (function () {
        function CloseJobArgs() {
        }
        CloseJobArgs.ShowModalEvent = 'show-close-job';
        CloseJobArgs.ModalApprovedEvent = 'close-job-approved';
        return CloseJobArgs;
    }());
    exports.CloseJobArgs = CloseJobArgs;
    var CloseJob = (function () {
        function CloseJob() {
        }
        __decorate([
            aurelia_framework_1.bindable, 
            __metadata('design:type', CloseJobArgs)
        ], CloseJob.prototype, "args", void 0);
        return CloseJob;
    }());
    exports.CloseJob = CloseJob;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/jobs/detail',["require", "exports", "aurelia-framework", "aurelia-router", '../../services/data/job-service', '../../services/data/customer-service', '../../services/data/activities-service', '../../services/notifications', '../../models/job', '../../models/customer', '../../models/job-type', '../../models/job-status', "../../models/billing-type", "../../models/work-type"], function (require, exports, aurelia_framework_1, aurelia_router_1, job_service_1, customer_service_1, activities_service_1, notifications_1, job_1, customer_1, job_type_1, job_status_1, billing_type_1, work_type_1) {
    "use strict";
    var EditJob = (function () {
        function EditJob(element, router, jobService, customerService, activitiesService) {
            var _this = this;
            this.element = element;
            this.router = router;
            this.jobService = jobService;
            this.customerService = customerService;
            this.activitiesService = activitiesService;
            this.jobTypes = job_type_1.JobType.OPTIONS;
            this.jobStatuses = job_status_1.JobStatus.OPTIONS;
            this.billingTypes = billing_type_1.BillingType.OPTIONS;
            this.workTypes = work_type_1.WorkType.OPTIONS;
            this.isFollowup = false;
            customerService.getAll()
                .then(function (customers) { return _this.customers = customers; })
                .catch(notifications_1.Notifications.error);
            activitiesService.getAll()
                .then(function (activities) { return _this.activities = activities; })
                .catch(notifications_1.Notifications.error);
        }
        EditJob.prototype.activate = function (params, routeConfig) {
            var _this = this;
            this.routeConfig = routeConfig;
            var id = params.id;
            if (_.isNaN(parseInt(id))) {
                this.job = new job_1.JobDocument();
                if (_.isString(params.type)) {
                    this.job.type = params.type;
                }
                if (params.from) {
                    this.jobService.getOne(params.from)
                        .then(function (prev) {
                        _this.isFollowup = true;
                        _this.job.customer = prev.customer;
                    });
                }
            }
            else {
                this.jobService.getOne(id)
                    .then(function (job) {
                    _this.job = job;
                    if (job.customer) {
                        _this.customer = job.customer.name;
                        _this.routeConfig.navModel.setTitle(_this.title);
                    }
                    if (!_.isArray(job.activities)) {
                        job.activities = [];
                    }
                    $('.dropdown.activity', _this.element).dropdown('set selected', job.activities);
                    if (_.isDate(job.startDate)) {
                        $('.calendar.start', _this.element).calendar('set date', job.startDate);
                    }
                })
                    .catch(function (err) {
                    notifications_1.Notifications.error(err);
                    _this.router.navigateToRoute('jobs.list');
                });
            }
        };
        EditJob.prototype.attached = function () {
            var _this = this;
            $('.dropdown.customer', this.element).dropdown({
                allowAdditions: true,
                hideAdditions: false,
                fullTextSearch: true,
                onChange: function (value) {
                    _this.job.customer = _.find(_this.customers, function (c) { return c._id === value; });
                    if (!_this.job.customer) {
                        _this.job.customer = new customer_1.CustomerDocument();
                        _this.job.customer.name = value;
                    }
                    console.log(_this.job.customer);
                }
            });
            $('.dropdown.basic.button', this.element).dropdown();
            $('.dropdown.activity', this.element).dropdown({
                allowAdditions: true,
                hideAdditions: false,
                fullTextSearch: true,
                onChange: function (value) {
                    _this.job.activities = (value || '').split(',');
                },
                onAdd: function (value) {
                    var exists = _.find(_this.activities, function (activity) { return activity.toLowerCase() === value.toLowerCase(); });
                    if (!exists) {
                        _this.activitiesService.create(value);
                    }
                }
            });
            $('#status', this.element).dropdown();
            $('#billingType', this.element).dropdown();
            $('#workType', this.element).dropdown();
            $('.calendar.start', this.element).calendar({
                type: 'date',
                onChange: function (date) { return _this.job.startDate = moment(date).toDate(); }
            });
            var $buttonBar = $('.button-bar', this.element);
            $buttonBar.visibility({
                once: false,
                onBottomPassed: function () {
                    $buttonBar.addClass('fixed top');
                },
                onBottomPassedReverse: function () {
                    $buttonBar.removeClass('fixed top');
                }
            });
        };
        EditJob.prototype.detached = function () {
            $('.dropdown.activity', this.element).dropdown('destroy');
            $('#status', this.element).dropdown('destroy');
            $('#billingType', this.element).dropdown('destroy');
            $('#workType', this.element).dropdown('destroy');
            $('.calendar.start', this.element).calendar('destroy');
            $('.button-bar', this.element).visibility('destroy');
            $('.dropdown.basic.button', this.element).dropdown('destroy');
        };
        Object.defineProperty(EditJob.prototype, "title", {
            get: function () {
                if (!this.job)
                    return '';
                return "Edit Job " + this.job.number;
            },
            enumerable: true,
            configurable: true
        });
        EditJob.prototype.onIsMultiDayChange = function () {
            if (this.job.isMultiDay) {
                $('#days', this.element).focus();
            }
            else {
                this.job.days = null;
            }
        };
        EditJob.prototype.onSaveClick = function () {
            var _this = this;
            this.saveJob()
                .then(function () { return _this.router.navigateToRoute('jobs.list'); })
                .catch(notifications_1.Notifications.error);
        };
        EditJob.prototype.onDeleteClick = function () {
            var _this = this;
            return this.jobService.delete(this.job.toJSON())
                .then(function () {
                notifications_1.Notifications.success('Job Deleted');
                _this.router.navigateToRoute('jobs.list');
            })
                .catch(notifications_1.Notifications.error);
        };
        EditJob.prototype.saveJob = function () {
            return this.jobService.save(this.job.toJSON())
                .then(function () {
                notifications_1.Notifications.success('Job Saved');
            })
                .catch(function (err) {
                notifications_1.Notifications.error(err);
            });
        };
        EditJob = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [Element, aurelia_router_1.Router, job_service_1.JobService, customer_service_1.CustomerService, activities_service_1.ActivitiesService])
        ], EditJob);
        return EditJob;
    }());
    exports.EditJob = EditJob;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/jobs/list-item',["require", "exports", 'aurelia-framework', 'aurelia-event-aggregator', "../../models/job-status", "../../models/job-type", "../../models/foreman", "../../services/data/job-service", "../../services/notifications", '../../services/auth', './close-job'], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, job_status_1, job_type_1, foreman_1, job_service_1, notifications_1, auth_1, close_job_1) {
    "use strict";
    var ListItem = (function () {
        function ListItem(element, jobService, auth, events) {
            this.element = element;
            this.jobService = jobService;
            this.auth = auth;
            this.events = events;
            this.expanded = false;
            this.foremen = foreman_1.Foreman.OPTIONS;
            this.jobStatuses = job_status_1.JobStatus.OPTIONS;
            if (!this.auth.isInRole(auth_1.Roles.OfficeAdmin)) {
                var close = _.findIndex(this.jobStatuses, function (status) { return status.id === job_status_1.JobStatus.CLOSED; });
                if (close !== -1) {
                    this.jobStatuses.splice(close, 1);
                }
            }
        }
        ListItem.prototype.attached = function () {
            var _this = this;
            this.jobManHoursSubscription = this.events.subscribe(close_job_1.CloseJobArgs.ModalApprovedEvent, this.onJobManHoursChanged.bind(this));
            $('.dropdown.status', this.element).dropdown({
                onChange: function (value) {
                    _this.job.status = value;
                    if (value === job_status_1.JobStatus.CLOSED) {
                        _this.events.publish(close_job_1.CloseJobArgs.ShowModalEvent, _this.job._id);
                    }
                    else {
                        _this.save('Status');
                    }
                }
            });
            $('.dropdown.foreman', this.element).dropdown({
                onChange: function (value) {
                    _this.job.foreman = value;
                    _this.save('Foreman');
                }
            });
        };
        ListItem.prototype.detached = function () {
            $('.dropdown.status', this.element).dropdown('destroy');
            $('.dropdown.foreman', this.element).dropdown('destroy');
        };
        ListItem.prototype.toggleExpanded = function () {
            this.expanded = !this.expanded;
        };
        Object.defineProperty(ListItem.prototype, "dateDisplay", {
            get: function () {
                var display = 'Not Scheduled';
                if (this.job.startDate == null && this.job.days > 1) {
                    display += " (" + this.job.days + " days)";
                }
                else if (this.job.startDate) {
                    var start = moment(this.job.startDate);
                    display = start.format('ddd, MMM Do');
                    if (this.job.days > 1) {
                        var end = start.clone().add(this.job.days, 'days');
                        while (end.weekday() === 6 || end.weekday() === 0) {
                            end.add(1, 'day');
                        }
                        display = display + " - " + end.format('ddd, MMM Do');
                    }
                }
                return display;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "jobStatus", {
            get: function () {
                var _this = this;
                return _.find(this.jobStatuses, function (s) { return s.id == _this.job.status; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "foremanDisplay", {
            get: function () {
                return this.job.foreman || 'Unassigned';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isPending", {
            get: function () {
                return this.job.status === 'pending';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isInProgress", {
            get: function () {
                return this.job.status === job_status_1.JobStatus.PENDING;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isComplete", {
            get: function () {
                return this.job.status === job_status_1.JobStatus.COMPLETE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isClosed", {
            get: function () {
                return this.job.status === job_status_1.JobStatus.CLOSED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isProject", {
            get: function () {
                return this.job.job_type === job_type_1.JobType.PROJECT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "isServiceCall", {
            get: function () {
                return this.job.job_type === job_type_1.JobType.SERVICE_CALL;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ListItem.prototype, "jobNumberDisplay", {
            get: function () {
                var prefix = this.job.job_type === job_type_1.JobType.SERVICE_CALL ? 'S' : 'P';
                return prefix + "-" + this.job.number;
            },
            enumerable: true,
            configurable: true
        });
        ListItem.prototype.onJobManHoursChanged = function (args) {
            if (args.jobId === this.job._id) {
                this.job.manHours = parseInt(args.manHours) || 0;
                this.save('Status');
            }
        };
        ListItem.prototype.save = function (field) {
            var _this = this;
            return this.jobService.save(this.job)
                .then(function (response) {
                _this.job._rev = response.rev;
                notifications_1.Notifications.success(field + " updated");
            })
                .catch(notifications_1.Notifications.error);
        };
        __decorate([
            aurelia_framework_1.bindable, 
            __metadata('design:type', Object)
        ], ListItem.prototype, "job", void 0);
        ListItem = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [Element, job_service_1.JobService, auth_1.Authentication, aurelia_event_aggregator_1.EventAggregator])
        ], ListItem);
        return ListItem;
    }());
    exports.ListItem = ListItem;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/jobs/list',["require", "exports", 'aurelia-framework', 'aurelia-event-aggregator', '../../services/auth', '../../services/log', '../../services/data/db', '../../models/job-status', '../../services/data/job-service', './close-job'], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, auth_1, log_1, db_1, job_status_1, job_service_1, close_job_1) {
    "use strict";
    var JobList = (function () {
        function JobList(element, auth, jobService, events) {
            this.element = element;
            this.auth = auth;
            this.jobService = jobService;
            this.events = events;
            this.myJobs = false;
            this.showOpen = true;
            this.showClosed = false;
            this.showCompleted = false;
            this.reverseSort = false;
            this.filtersExpanded = false;
            this.closeJobArgs = new close_job_1.CloseJobArgs;
            this.refresh();
            this.showCompleted = auth.isInRole(auth_1.Roles.OfficeAdmin);
            this.showClosed = auth.isInRole(auth_1.Roles.OfficeAdmin);
            events.subscribe(db_1.Database.SyncChangeEvent, this.refresh.bind(this));
        }
        JobList.prototype.attached = function () {
            var _this = this;
            var that = this;
            $('.modal.close-job', this.element).modal({
                onApprove: function () {
                    _this.events.publish(close_job_1.CloseJobArgs.ModalApprovedEvent, that.closeJobArgs);
                }
            });
            $('.ui.toggle.checkbox', this.element)
                .checkbox({
                onChange: this.filter.bind(this)
            });
            this.showModalSubscription = this.events.subscribe(close_job_1.CloseJobArgs.ShowModalEvent, this.showCloseJobModal.bind(this));
        };
        JobList.prototype.detached = function () {
            $('.modal.close-job', this.element).modal('destroy');
            this.showModalSubscription.dispose();
        };
        JobList.prototype.refresh = function () {
            var _this = this;
            this.jobService.getAll()
                .then(function (items) {
                _this.items = items;
                _this.filter();
            });
        };
        JobList.prototype.filter = function () {
            var _this = this;
            var me = this.auth.userInfo().name;
            var mine = function (i) { return !_this.myJobs || i.foreman === me; };
            var open = function (i) { return _this.showOpen && (i.status === job_status_1.JobStatus.PENDING || i.status === job_status_1.JobStatus.IN_PROGRESS); };
            var completed = function (i) { return _this.showCompleted && (i.status == job_status_1.JobStatus.COMPLETE); };
            var closed = function (i) { return _this.showClosed && (i.status === job_status_1.JobStatus.CLOSED); };
            log_1.log.debug("Only show my jobs: " + this.myJobs);
            log_1.log.debug("Show open jobs: " + this.showOpen);
            log_1.log.debug("Show completed jobs: " + this.showCompleted);
            log_1.log.debug("Show closed jobs: " + this.showClosed);
            var items = _.filter(this.items, function (i) { return mine(i) && (open(i) || closed(i) || completed(i)); }), sortedItems = _.sortBy(items, function (i) { return parseInt(i.number); });
            if (this.reverseSort) {
                sortedItems.reverse();
            }
            this.filteredItems = sortedItems;
        };
        JobList.prototype.toggleFiltersExpanded = function () {
            this.filtersExpanded = !this.filtersExpanded;
        };
        JobList.prototype.showCloseJobModal = function (id) {
            this.closeJobArgs.jobId = id;
            this.closeJobArgs.manHours = null;
            $('.modal.close-job').modal('show');
        };
        Object.defineProperty(JobList.prototype, "isOwner", {
            get: function () {
                return this.auth.isInRole(auth_1.Roles.Owner);
            },
            enumerable: true,
            configurable: true
        });
        JobList = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [Element, auth_1.Authentication, job_service_1.JobService, aurelia_event_aggregator_1.EventAggregator])
        ], JobList);
        return JobList;
    }());
    exports.JobList = JobList;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/views/jobs/new',["require", "exports", "aurelia-framework", "aurelia-router", '../../services/data/job-service', '../../services/data/customer-service', '../../services/notifications', '../../models/job', '../../models/customer', '../../models/job-type', '../../models/job-status', "../../models/billing-type", "../../models/work-type"], function (require, exports, aurelia_framework_1, aurelia_router_1, job_service_1, customer_service_1, notifications_1, job_1, customer_1, job_type_1, job_status_1, billing_type_1, work_type_1) {
    "use strict";
    var NewJob = (function () {
        function NewJob(element, router, jobService, customerService) {
            var _this = this;
            this.element = element;
            this.router = router;
            this.jobService = jobService;
            this.customerService = customerService;
            this.jobTypes = job_type_1.JobType.OPTIONS;
            this.jobStatuses = job_status_1.JobStatus.OPTIONS;
            this.billingTypes = billing_type_1.BillingType.OPTIONS;
            this.workTypes = work_type_1.WorkType.OPTIONS;
            this.isFollowup = false;
            this.job = new job_1.JobDocument();
            customerService.getAll()
                .then(function (customers) { return _this.customers = customers; })
                .catch(notifications_1.Notifications.error);
        }
        NewJob.prototype.activate = function (params, routeConfig) {
            var _this = this;
            routeConfig.title = this.title;
            if (_.isString(params.type)) {
                this.job.type = params.type;
            }
            if (params.from) {
                this.jobService.getOne(params.from)
                    .then(function (prev) {
                    _this.isFollowup = true;
                    _this.job.customer = prev.customer;
                });
            }
        };
        NewJob.prototype.attached = function () {
            var _this = this;
            $('.dropdown.customer', this.element).dropdown({
                allowAdditions: true,
                hideAdditions: false,
                fullTextSearch: true,
                onChange: function (value) {
                    _this.job.customer = _.find(_this.customers, function (c) { return c._id === value; });
                    if (!_this.job.customer) {
                        _this.job.customer = new customer_1.CustomerDocument();
                        _this.job.customer.name = value;
                    }
                    console.log(_this.job.customer);
                }
            });
            $('#status', this.element).dropdown();
            $('#billingType', this.element).dropdown();
            $('#workType', this.element).dropdown();
            $('.calendar.start', this.element).calendar({
                type: 'date',
                onChange: function (date) { return _this.job.startDate = moment(date).toDate(); }
            });
            var $buttonBar = $('.button-bar', this.element);
            $buttonBar.visibility({
                once: false,
                onBottomPassed: function () {
                    $buttonBar.addClass('fixed top');
                },
                onBottomPassedReverse: function () {
                    $buttonBar.removeClass('fixed top');
                }
            });
        };
        NewJob.prototype.detached = function () {
            $('.dropdown.customer', this.element).dropdown('destroy');
            $('#status', this.element).dropdown('destroy');
            $('#billingType', this.element).dropdown('destroy');
            $('#workType', this.element).dropdown('destroy');
            $('.calendar.start', this.element).calendar('destroy');
            $('.button-bar', this.element).visibility('destroy');
        };
        Object.defineProperty(NewJob.prototype, "title", {
            get: function () {
                return 'New Job';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NewJob.prototype, "customer_id", {
            get: function () {
                return this.job.customer ? this.job.customer._id : null;
            },
            enumerable: true,
            configurable: true
        });
        NewJob.prototype.onIsMultiDayChange = function () {
            if (this.job.isMultiDay) {
                $('#days', this.element).focus();
            }
            else {
                this.job.days = null;
            }
        };
        NewJob.prototype.onSaveClick = function () {
            var _this = this;
            if (this.customer_id) {
                this.saveJob()
                    .then(function () { return _this.router.navigateToRoute('jobs.list'); });
            }
            else {
                this.saveCustomer(this.job.customer)
                    .then(function (customer) {
                    _this.job.customer = customer;
                    _this.saveJob()
                        .then(function () { return _this.router.navigateToRoute('jobs.list'); });
                })
                    .catch(notifications_1.Notifications.error);
            }
        };
        NewJob.prototype.saveJob = function () {
            return this.jobService.save(this.job.toJSON())
                .then(function () {
                notifications_1.Notifications.success('Job Saved');
            })
                .catch(function (err) {
                notifications_1.Notifications.error(err);
            });
        };
        NewJob.prototype.saveCustomer = function (customer) {
            return this.customerService.create(customer.toJSON());
        };
        NewJob = __decorate([
            aurelia_framework_1.autoinject(), 
            __metadata('design:paramtypes', [Element, aurelia_router_1.Router, job_service_1.JobService, customer_service_1.CustomerService])
        ], NewJob);
        return NewJob;
    }());
    exports.NewJob = NewJob;
});

define('text!styles/list.css', ['module'], function(module) { module.exports = ".ui.cards {\n  padding-top: 10px;\n}\n"; });
define('text!resources/views/app.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"styles/styles.css\"></require>\n  <require from=\"./controls/nav-bar\"></require>\n\n  <nav-bar router.bind=\"router\"></nav-bar>\n\n  <div class=\"ui main container\">\n    <router-view></router-view>\n  </div>\n</template>\n"; });
define('text!styles/login.css', ['module'], function(module) { module.exports = "@import '../../node_modules/semantic-ui-css/semantic.css';\n.login-form {\n  height: 100%;\n  background-color: #DADADA;\n}\n.login-form > .column {\n  background-color: #ffffff;\n  max-width: 450px;\n}\n.login-form .ui.error.message ul {\n  list-style: none;\n}\n.login-form .ui.error.message ul li:before {\n  content: \"\";\n}\n"; });
define('text!resources/views/login.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"styles/login.css\"></require>\n  <div class=\"login-form ui middle aligned center aligned grid\">\n    <div class=\"column\">\n      <h2 class=\"ui blue image header\">\n        <img src=\"/images/logo.png\" class=\"image\">\n        Langendoen Mechanical Job Management Site\n      </h2>\n      <form class=\"ui large form ${errorMessage ? 'error' : ''}\" submit.trigger=\"login($event)\" method=\"post\"\n            novalidate>\n        <div class=\"ui stacked segment\">\n          <div class=\"field\">\n            <div class=\"ui left icon input\">\n              <i class=\"user icon\"></i>\n              <input id=\"username\" name=\"username\" type=\"text\" value.bind=\"username\" placeholder=\"User Name\" required>\n            </div>\n          </div>\n          <div class=\"field\">\n            <div class=\"ui left icon input\">\n              <i class=\"lock icon\"></i>\n              <input id=\"password\" name=\"password\" type=\"password\" value.bind=\"password\" placeholder=\"Password\"\n                     required>\n            </div>\n          </div>\n          <input class=\"ui fluid large blue submit button\" type=\"submit\" value=\"Login\" submit.trigger=\"cancel($event)\">\n          <div class=\"ui error message\" show.bind=\"errorMessage\">\n            <ul class=\"list\">\n              <li>\n                ${errorMessage}\n              </li>\n            </ul>\n          </div>\n        </div>\n      </form>\n    </div>\n  </div>\n</template>\n"; });
define('text!resources/views/controls/nav-bar.html', ['module'], function(module) { module.exports = "<template>\n    <div id=\"main-menu\" class=\"ui inverted segment\">\n        <div class=\"ui container\">\n            <div class=\"ui large secondary inverted pointing menu\">\n                <a href=\"#\" class=\"item logo-item\">\n                    <img src=\"images/logo.png\" alt=\"Logo\" class=\"logo\">\n                    <span>Langendoen Mechanical</span>\n                </a>\n                <a repeat.for=\"item of router.navigation\" href.bind=\"item.href\" class=\"item ${item.isActive ? 'active' : ''}\">\n                    ${item.title}\n                </a>\n                <div class=\"ui right dropdown item\">\n                    ${userName}\n                    <i class=\"dropdown icon\"></i>\n                    <div class=\"menu\">\n                        <button class=\"item\" click.trigger=\"logout()\">Logout</button>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</template>\n"; });
define('text!resources/views/jobs/close-job.html', ['module'], function(module) { module.exports = "<template>\n    <form class=\"ui big form small modal close-job\">\n        <i class=\"close icon\"></i>\n        <div class=\"header\">Close Job</div>\n        <div class=\"content\">\n            <div class=\"description\">\n                <p>Enter the man-hours for the job</p>\n                <input type=\"number\" placeholder=\"Man Hours\" value.bind=\"args.manHours\">\n            </div>\n        </div>\n        <div class=\"actions\">\n            <button class=\"ui button cancel\">Cancel</button>\n            <button class=\"ui button positive\">OK</button>\n        </div>\n    </form>\n</template>"; });
define('text!styles/styles.css', ['module'], function(module) { module.exports = "@import '../../node_modules/semantic-ui-css/semantic.css';\n@import '../../node_modules/semantic-ui/dist/components/calendar.css';\n.toast-title {\n  font-weight: bold;\n}\n.toast-message {\n  -ms-word-wrap: break-word;\n  word-wrap: break-word;\n}\n.toast-message a,\n.toast-message label {\n  color: #FFFFFF;\n}\n.toast-message a:hover {\n  color: #CCCCCC;\n  text-decoration: none;\n}\n.toast-close-button {\n  position: relative;\n  right: -0.3em;\n  top: -0.3em;\n  float: right;\n  font-size: 20px;\n  font-weight: bold;\n  color: #FFFFFF;\n  -webkit-text-shadow: 0 1px 0 #ffffff;\n  text-shadow: 0 1px 0 #ffffff;\n  opacity: 0.8;\n  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=80);\n  filter: alpha(opacity=80);\n}\n.toast-close-button:hover,\n.toast-close-button:focus {\n  color: #000000;\n  text-decoration: none;\n  cursor: pointer;\n  opacity: 0.4;\n  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=40);\n  filter: alpha(opacity=40);\n}\n/*Additional properties for button version\n iOS requires the button element instead of an anchor tag.\n If you want the anchor version, it requires `href=\"#\"`.*/\nbutton.toast-close-button {\n  padding: 0;\n  cursor: pointer;\n  background: transparent;\n  border: 0;\n  -webkit-appearance: none;\n}\n.toast-top-center {\n  top: 0;\n  right: 0;\n  width: 100%;\n}\n.toast-bottom-center {\n  bottom: 0;\n  right: 0;\n  width: 100%;\n}\n.toast-top-full-width {\n  top: 0;\n  right: 0;\n  width: 100%;\n}\n.toast-bottom-full-width {\n  bottom: 0;\n  right: 0;\n  width: 100%;\n}\n.toast-top-left {\n  top: 12px;\n  left: 12px;\n}\n.toast-top-right {\n  top: 12px;\n  right: 12px;\n}\n.toast-bottom-right {\n  right: 12px;\n  bottom: 12px;\n}\n.toast-bottom-left {\n  bottom: 12px;\n  left: 12px;\n}\n#toast-container {\n  position: fixed;\n  z-index: 999999;\n  pointer-events: none;\n  /*overrides*/\n}\n#toast-container * {\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n#toast-container > div {\n  position: relative;\n  pointer-events: auto;\n  overflow: hidden;\n  margin: 0 0 6px;\n  padding: 15px 15px 15px 50px;\n  width: 300px;\n  -moz-border-radius: 3px 3px 3px 3px;\n  -webkit-border-radius: 3px 3px 3px 3px;\n  border-radius: 3px 3px 3px 3px;\n  background-position: 15px center;\n  background-repeat: no-repeat;\n  -moz-box-shadow: 0 0 12px #999999;\n  -webkit-box-shadow: 0 0 12px #999999;\n  box-shadow: 0 0 12px #999999;\n  color: #FFFFFF;\n  opacity: 0.8;\n  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=80);\n  filter: alpha(opacity=80);\n}\n#toast-container > :hover {\n  -moz-box-shadow: 0 0 12px #000000;\n  -webkit-box-shadow: 0 0 12px #000000;\n  box-shadow: 0 0 12px #000000;\n  opacity: 1;\n  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100);\n  filter: alpha(opacity=100);\n  cursor: pointer;\n}\n#toast-container > .toast-info {\n  background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGwSURBVEhLtZa9SgNBEMc9sUxxRcoUKSzSWIhXpFMhhYWFhaBg4yPYiWCXZxBLERsLRS3EQkEfwCKdjWJAwSKCgoKCcudv4O5YLrt7EzgXhiU3/4+b2ckmwVjJSpKkQ6wAi4gwhT+z3wRBcEz0yjSseUTrcRyfsHsXmD0AmbHOC9Ii8VImnuXBPglHpQ5wwSVM7sNnTG7Za4JwDdCjxyAiH3nyA2mtaTJufiDZ5dCaqlItILh1NHatfN5skvjx9Z38m69CgzuXmZgVrPIGE763Jx9qKsRozWYw6xOHdER+nn2KkO+Bb+UV5CBN6WC6QtBgbRVozrahAbmm6HtUsgtPC19tFdxXZYBOfkbmFJ1VaHA1VAHjd0pp70oTZzvR+EVrx2Ygfdsq6eu55BHYR8hlcki+n+kERUFG8BrA0BwjeAv2M8WLQBtcy+SD6fNsmnB3AlBLrgTtVW1c2QN4bVWLATaIS60J2Du5y1TiJgjSBvFVZgTmwCU+dAZFoPxGEEs8nyHC9Bwe2GvEJv2WXZb0vjdyFT4Cxk3e/kIqlOGoVLwwPevpYHT+00T+hWwXDf4AJAOUqWcDhbwAAAAASUVORK5CYII=\") !important;\n}\n#toast-container > .toast-error {\n  background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHOSURBVEhLrZa/SgNBEMZzh0WKCClSCKaIYOED+AAKeQQLG8HWztLCImBrYadgIdY+gIKNYkBFSwu7CAoqCgkkoGBI/E28PdbLZmeDLgzZzcx83/zZ2SSXC1j9fr+I1Hq93g2yxH4iwM1vkoBWAdxCmpzTxfkN2RcyZNaHFIkSo10+8kgxkXIURV5HGxTmFuc75B2RfQkpxHG8aAgaAFa0tAHqYFfQ7Iwe2yhODk8+J4C7yAoRTWI3w/4klGRgR4lO7Rpn9+gvMyWp+uxFh8+H+ARlgN1nJuJuQAYvNkEnwGFck18Er4q3egEc/oO+mhLdKgRyhdNFiacC0rlOCbhNVz4H9FnAYgDBvU3QIioZlJFLJtsoHYRDfiZoUyIxqCtRpVlANq0EU4dApjrtgezPFad5S19Wgjkc0hNVnuF4HjVA6C7QrSIbylB+oZe3aHgBsqlNqKYH48jXyJKMuAbiyVJ8KzaB3eRc0pg9VwQ4niFryI68qiOi3AbjwdsfnAtk0bCjTLJKr6mrD9g8iq/S/B81hguOMlQTnVyG40wAcjnmgsCNESDrjme7wfftP4P7SP4N3CJZdvzoNyGq2c/HWOXJGsvVg+RA/k2MC/wN6I2YA2Pt8GkAAAAASUVORK5CYII=\") !important;\n}\n#toast-container > .toast-success {\n  background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADsSURBVEhLY2AYBfQMgf///3P8+/evAIgvA/FsIF+BavYDDWMBGroaSMMBiE8VC7AZDrIFaMFnii3AZTjUgsUUWUDA8OdAH6iQbQEhw4HyGsPEcKBXBIC4ARhex4G4BsjmweU1soIFaGg/WtoFZRIZdEvIMhxkCCjXIVsATV6gFGACs4Rsw0EGgIIH3QJYJgHSARQZDrWAB+jawzgs+Q2UO49D7jnRSRGoEFRILcdmEMWGI0cm0JJ2QpYA1RDvcmzJEWhABhD/pqrL0S0CWuABKgnRki9lLseS7g2AlqwHWQSKH4oKLrILpRGhEQCw2LiRUIa4lwAAAABJRU5ErkJggg==\") !important;\n}\n#toast-container > .toast-warning {\n  background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGYSURBVEhL5ZSvTsNQFMbXZGICMYGYmJhAQIJAICYQPAACiSDB8AiICQQJT4CqQEwgJvYASAQCiZiYmJhAIBATCARJy+9rTsldd8sKu1M0+dLb057v6/lbq/2rK0mS/TRNj9cWNAKPYIJII7gIxCcQ51cvqID+GIEX8ASG4B1bK5gIZFeQfoJdEXOfgX4QAQg7kH2A65yQ87lyxb27sggkAzAuFhbbg1K2kgCkB1bVwyIR9m2L7PRPIhDUIXgGtyKw575yz3lTNs6X4JXnjV+LKM/m3MydnTbtOKIjtz6VhCBq4vSm3ncdrD2lk0VgUXSVKjVDJXJzijW1RQdsU7F77He8u68koNZTz8Oz5yGa6J3H3lZ0xYgXBK2QymlWWA+RWnYhskLBv2vmE+hBMCtbA7KX5drWyRT/2JsqZ2IvfB9Y4bWDNMFbJRFmC9E74SoS0CqulwjkC0+5bpcV1CZ8NMej4pjy0U+doDQsGyo1hzVJttIjhQ7GnBtRFN1UarUlH8F3xict+HY07rEzoUGPlWcjRFRr4/gChZgc3ZL2d8oAAAAASUVORK5CYII=\") !important;\n}\n#toast-container.toast-top-center > div,\n#toast-container.toast-bottom-center > div {\n  width: 300px;\n  margin-left: auto;\n  margin-right: auto;\n}\n#toast-container.toast-top-full-width > div,\n#toast-container.toast-bottom-full-width > div {\n  width: 96%;\n  margin-left: auto;\n  margin-right: auto;\n}\n.toast {\n  background-color: #030303;\n}\n.toast-success {\n  background-color: #51A351;\n}\n.toast-error {\n  background-color: #BD362F;\n}\n.toast-info {\n  background-color: #2F96B4;\n}\n.toast-warning {\n  background-color: #F89406;\n}\n.toast-progress {\n  position: absolute;\n  left: 0;\n  bottom: 0;\n  height: 4px;\n  background-color: #000000;\n  opacity: 0.4;\n  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=40);\n  filter: alpha(opacity=40);\n}\n/*Responsive Design*/\n@media all and (max-width: 240px) {\n  #toast-container > div {\n    padding: 8px 8px 8px 50px;\n    width: 11em;\n  }\n  #toast-container .toast-close-button {\n    right: -0.2em;\n    top: -0.2em;\n  }\n}\n@media all and (min-width: 241px) and (max-width: 480px) {\n  #toast-container > div {\n    padding: 8px 8px 8px 50px;\n    width: 18em;\n  }\n  #toast-container .toast-close-button {\n    right: -0.2em;\n    top: -0.2em;\n  }\n}\n@media all and (min-width: 481px) and (max-width: 768px) {\n  #toast-container > div {\n    padding: 15px 15px 15px 50px;\n    width: 25em;\n  }\n}\n.ui.secondary.pointing.menu .item.logo-item {\n  padding: 0 20px;\n}\n.ui.fixed.menu.button-bar.top {\n  top: 50px;\n}\n.ui.popup.calendar:focus {\n  outline: none;\n}\n@media only screen and (max-width: 767px) {\n  #main-menu > .ui.container {\n    margin: 0px !important;\n  }\n  list-item {\n    width: 100%;\n  }\n  list-item > .ui.card {\n    width: 100%;\n  }\n  list-item > .ui.card .ui.header {\n    margin-top: 10px;\n  }\n  .menu .item.logo-item span {\n    display: none;\n  }\n  .ui.cards > .card {\n    width: 100%;\n  }\n  .hide-mobile {\n    display: none !important;\n  }\n}\n@media only screen and (min-width: 768px) {\n  .hide-desktop {\n    display: none !important;\n  }\n}\n"; });
define('text!resources/views/jobs/detail.html', ['module'], function(module) { module.exports = "<template>\n    <div class=\"ui menu button-bar\">\n        <div class=\"ui container\">\n            <a route-href=\"route:jobs.list\" class=\"ui button\">Cancel</a>\n            <button type=\"button\" class=\"ui button positive\" click.trigger=\"onSaveClick()\">\n                <i class=\"fa fa-save\"></i>\n                Save\n            </button>\n        </div>\n    </div>\n\n    <form class=\"ui form\">\n        <h2 class=\"ui ${isFollowup ? '' : 'dividing header'}\">New Job</h2>\n        <h3 class=\"ui dividing header\" show.bind=\"isFollowup\" style=\"margin-top: 0;\">${job.customer.name}</h3>\n\n        <div class=\"fields\">\n            <div class=\"field eight wide\" hide.bind=\"isFollowup\">\n                <label for=\"customer\">Customer</label>\n                <div class=\"ui search selection dropdown customer\">\n                    <input type=\"hidden\" name=\"customer\" id=\"customer\" value.bind=\"customer_id\">\n                    <i class=\"dropdown icon\"></i>\n                    <div class=\"default text\">Select Customer</div>\n                    <div class=\"menu\">\n                        <div repeat.for=\"customer of customers\" class=\"item\" data-value.bind=\"customer._id\">\n                            ${customer.name}\n                        </div>\n                    </div>\n                </div>\n            </div>\n          <div class=\"field eight wide\">\n            <label for=\"job-name\">Job Name</label>\n            <input type=\"text\" name=\"job-name\" id=\"job-name\" value.bind=\"job.name\">\n          </div>\n        </div>\n        <div class=\"fields\">\n            <div class=\"field sixteen wide\">\n                <label for=\"description\">Job Description</label>\n                <textarea name=\"description\" id=\"description\" value.bind=\"job.description\" cols=\"30\" rows=\"5\"></textarea>\n            </div>\n        </div>\n        <div class=\"fields\">\n            <div class=\"field six wide\">\n                <label for=\"jobType\">Job Type</label>\n                <select name=\"jobType\" id=\"jobType\" value.bind=\"job.job_type\" class=\"ui dropdown\">\n                    <option repeat.for=\"t of jobTypes\" value=\"${t.id}\">${t.name}</option>\n                </select>\n            </div>\n        </div>\n        <div class=\"fields\">\n            <div class=\"field six wide\">\n                <label for=\"status\">Status</label>\n                <select name=\"status\" id=\"status\" value.bind=\"job.status\" class=\"ui dropdown\">\n                    <option repeat.for=\"s of jobStatuses\" value=\"${s.id}\">${s.name}</option>\n                </select>\n            </div>\n            <div class=\"field six wide\">\n                <label for=\"billingType\">Billing Type</label>\n                <select name=\"billingType\" id=\"billingType\" value.bind=\"job.billing_type\" class=\"ui dropdown\">\n                    <option repeat.for=\"bt of billingTypes\" value=\"${bt.id}\">${bt.name}</option>\n                </select>\n            </div>\n            <div class=\"field six wide\">\n                <label for=\"jobType\">Work Type</label>\n                <select name=\"workType\" id=\"workType\" value.bind=\"job.work_type\" class=\"ui dropdown\">\n                    <option repeat.for=\"wt of workTypes\" value=\"${wt.id}\">${wt.name}</option>\n                </select>\n            </div>\n        </div>\n        <div class=\"fields\">\n            <div class=\"field five wide\">\n                <label for=\"start\">Scheduled Start</label>\n                <div class=\"ui calendar start\">\n                    <div class=\"ui input left icon\">\n                        <i class=\"calendar icon\"></i>\n                        <input type=\"text\" placeholder=\"Date/Time\" id=\"start\" name=\"start\">\n                    </div>\n                </div>\n            </div>\n            <div class=\"field\">\n                <label style=\"visibility: hidden;\">&nbsp;</label>\n                <div class=\"ui checkbox\">\n                    <input type=\"checkbox\" name=\"multiday\" id=\"multiday\" checked.bind=\"job.isMultiDay\" change.trigger=\"onIsMultiDayChange()\">\n                    <label for=\"multiday\">Multi-Day Job?</label>\n                </div>\n            </div>\n            <div class=\"field two wide\" show.bind=\"job.isMultiDay\">\n                <label for=\"days\">Days</label>\n                <input type=\"number\" id=\"days\" name=\"days\" value.bind=\"job.days\">\n            </div>\n        </div>\n        <div class=\"fields\">\n            <div class=\"field sixteen wide\">\n                <label for=\"notes\">Notes</label>\n                <textarea name=\"notes\" id=\"notes\" value.bind=\"job.notes\" cols=\"30\" rows=\"3\"></textarea>\n            </div>\n        </div>\n    </form>\n</template>\n"; });
define('text!resources/views/jobs/list-item.html', ['module'], function(module) { module.exports = "<template>\n    <div class=\"ui card\">\n        <div class=\"content\">\n            <div class=\"right floated meta\" style=\"max-width: 40%;\">\n                <span>${dateDisplay}</span>\n            </div>\n            <a class=\"header\" route-href=\"route:jobs.edit; params.bind: {id: job._id}\">\n                <i class=\"icon building\" show.bind=\"isProject\"></i>\n                <i class=\"icon wrench\" show.bind=\"isServiceCall\"></i>\n                &nbsp;${jobNumberDisplay}\n            </a>\n            <div class=\"ui header\">${job.customer.name}</div>\n        </div>\n        <div class=\"content\">\n            <div class=\"ui sub header\">\n                <button class=\"ui basic icon button right floated hide-desktop\" click.trigger=\"toggleExpanded()\">\n                    <i class=\"dropdown icon ${expanded ? 'vertically flipped' : ''}\"></i>\n                </button>\n                ${job.name}\n            </div>\n            <p class=\"ui ${expanded ? '' : 'hide-mobile'}\">${job.description}</p>\n        </div>\n        <div class=\"ui extra content ${expanded ? '' : 'hide-mobile'}\">\n            <div class=\"right floated author\">\n                <div class=\"ui dropdown foreman\">\n                    <div class=\"text\">\n                        <i class=\"icon user\" show.bind=\"job.foreman\"></i>\n                        <i class=\"icon user plus\" hide.bind=\"job.foreman\"></i>\n                        &nbsp;${foremanDisplay}\n                    </div>\n                    <i class=\"dropdown icon\"></i>\n                    <div class=\"menu\">\n                        <div repeat.for=\"f of foremen\" class=\"item\" data-value.bind=\"f\">${f}</div>\n                    </div>\n                </div>\n            </div>\n            <div class=\"ui dropdown status\">\n                <div class=\"text\">\n                    <i class=\"icon circular ${jobStatus.cssClass}\"></i>\n                    <span>&nbsp;${jobStatus.name}</span>\n                </div>\n                <i class=\"dropdown icon\"></i>\n                <div class=\"menu\">\n                    <div class=\"item\" repeat.for=\"status of jobStatuses\" data-value.bind=\"status.id\">\n                        <i class=\"icon circular ${status.cssClass}\"></i>\n                        <span>&nbsp;${status.name}</span>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</template>\n"; });
define('text!resources/views/jobs/list.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./list-item\"></require>\n  <require from=\"./close-job\"></require>\n\n  <require from=\"styles/list.css\"></require>\n\n  <div class=\"ui segment\">\n    <button class=\"ui button basic right floated hide-desktop mini\" click.trigger=\"toggleFiltersExpanded()\"\n            show.bind=\"isOwner\">\n      Filters\n      <i class=\"dropdown icon ${filtersExpanded ? 'vertically flipped' : ''}\"></i>\n    </button>\n    <div class=\"ui two column grid stackable container ${filtersExpanded ? '' : 'hide-mobile'}\" show.bind=\"isOwner\">\n      <div class=\"column\">\n        <div class=\"ui toggle checkbox\">\n          <input type=\"checkbox\" checked.bind=\"myJobs\">\n          <label>My Jobs Only</label>\n        </div>\n      </div>\n      <div class=\"column\">\n        <div class=\"ui toggle checkbox column\">\n          <input type=\"checkbox\" checked.bind=\"showOpen\">\n          <label>Show open jobs</label>\n        </div>\n      </div>\n      <div class=\"column\">\n        <div class=\"ui toggle checkbox column\">\n          <input type=\"checkbox\" checked.bind=\"showCompleted\">\n          <label>Show completed jobs</label>\n        </div>\n      </div>\n      <div class=\"column\">\n        <div class=\"ui toggle checkbox column\">\n          <input type=\"checkbox\" checked.bind=\"showClosed\">\n          <label>Show closed jobs</label>\n        </div>\n      </div>\n      <div class=\"column\">\n        <div class=\"ui toggle checkbox column\">\n          <input type=\"checkbox\" checked.bind=\"reverseSort\">\n          <label>Reverse Sort</label>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"ui cards\" show.bind=\"filteredItems.length\">\n      <list-item job.bind=\"item\" repeat.for=\"item of filteredItems\"></list-item>\n    </div>\n    <div class=\"ui message\" show.bind=\"!filteredItems.length\">\n      <div class=\"header\">No items</div>\n    </div>\n  </div>\n\n  <close-job id=\"close-job\" args.bind=\"closeJobArgs\"></close-job>\n</template>\n"; });
//# sourceMappingURL=app-bundle.js.map