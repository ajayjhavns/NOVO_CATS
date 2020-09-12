sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/nn/cats/employee/model/models",
	"com/nn/cats/employee/util/GeneralTools",
	'sap/m/MessageBox',
	"com/nn/cats/employee/util/ClassExtensions",
	"com/nn/cats/employee/classes/UILogic",
	"com/nn/cats/employee/classes/timesheet/CatsConfigurator",
	"com/nn/cats/employee/classes/UtilLogic",
	"com/nn/cats/employee/classes/ErrorHandler",
	"com/nn/cats/employee/classes/Roles",
	"sap/m/MessageToast",
	"com/nn/cats/employee/util/Utils"
], function (UIComponent, Device, models, GeneralTools, MessageBox, ClassExtensions, UILogic, CatsConfigurator, UtilLogic,
	ErrorHandler, Roles, MessageToast, Utils) {

	"use strict";

	return UIComponent.extend("com.nn.cats.employee.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			this._isTest = false;
			this._uilogic = new UILogic(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			//We need tools
			this._tools = new GeneralTools(this);

			this.loadAppConfiguration();
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			//We need extended functionality on promises
			new ClassExtensions().extendPromise();

			// enable routing
			this.getRouter().initialize();

			// set message model
			//this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");

			this._utilLogic = new UtilLogic(this);
			this._errorHandler = new ErrorHandler(this);

			//Add model event handlers
			this.modelInit();
		},

		loadMonthList: function () {

			var mainControlModel = this.getModels().getMainControl(this);
			var mainControl = mainControlModel.getData();
			var utils = this.getUtilLogic();
			var months = mainControl.months;

			for (var i = 0; i < 12; i++) {

				var month = {
					id: (i + 1),
					text: utils.getMonthByIndex(i + 1)
				};

				months.push(month);
			}
		},

		modelInit: function () {
			var that = this;
			that.waitUntil = false;

			//Show busy while fetching the metadata
			this.getTools().showBusy(0, 0);

			var oModel = this.getModel("SAP");

			oModel.attachMetadataLoaded(null, function () {

				that.getTools().hideBusy(700);

			}, null);

			//Hook up and send wait dialog when requests are sent
			oModel.attachRequestSent(null, function () {
				if (!that._disableBusy || that._disableBusy === false) {
					that.getTools().showBusy(0, 0);
				}

			}, null);

			//Thigs we do when request is success
			oModel.attachRequestCompleted(null, function () {

				if (!that.waitUntil) {
					that.getTools().hideBusy(700);
				}

			}, null);

			//Thigs we do when request is failed
			oModel.attachRequestFailed(null, function () {

				that.getTools().hideBusy(700);
				that.waitUntil = false;

			}, null);

			//Metadata failed event - SAP odata service
			oModel.attachMetadataFailed(null, function (oError) {
				that.getTools().hideBusy(0);
				var param = oError.getParameters();
				if (param.statusCode == 403) { //forbidden
					that.getTools().showMessage(that.getTools().getText("err_sap_connection_forbidden"), "error");
				} else {
					that.getTools().showMessage(that.getTools().getText("err_connection_problems_sap"), "error");
				}
				var configModel = that.getModel("ConfigModel").getData();
				configModel.enabled = false;
				that.getModel("ConfigModel").refresh();
			}, null);

			//Metadata failed event - Java Service
			this.getModel().attachMetadataFailed(null, function (oError) {
				that.getTools().hideBusy(0);
				//var param = oError.getParameters();
				that.getTools().showMessage(that.getTools().getText("err_connection_problems_java"), "error");
				var configModel = that.getModel("ConfigModel").getData();
				configModel.enabled = false;
				that.getModel("ConfigModel").refresh();
			}, null);

		},

		loadAppConfiguration: function (next) {

			var that = this;
			var loadOdataConfig = function () {
				that._catsConfigurator = new CatsConfigurator(that);
				that.calcAllowedDates();
				that._roles = new Roles(that);
			};
			//set model AppConfig
			models.initApplicationConfiguration(this, loadOdataConfig);
		},

		calcAllowedDates: function () {
			var today = new Date();
			// var weekToday = this.getWeek(today); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			var weekToday = this.getUILogic().getWeekNo(today); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			if (this._isTest) {
				today = new Date(2018, 1, 8);
			}
			var obj = {};
			obj.allowedDays = {};
			obj.allowedDays.valid = [];

			obj.allowedDays.valid = this.calcWeek(today, this.appconfig.timeSheetConfig.weeksBackInTime, -1, obj.allowedDays.valid);
			obj.allowedDays.valid = this.calcWeek(today, this.appconfig.timeSheetConfig.weeksForwardInTime, +1, obj.allowedDays.valid);
			obj.allowedDays.valid.push(weekToday);
			var model = this.getModels().createModel(obj);
			this.setModel(model, "ConfigModel");
		},

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		// This function returns the valid week numbers used for week-navigation 
		calcWeek: function (dateToday, iWeeksToNavigate, iDirection, aValidWeekNumbers) {
			var dateTemp = new Date();
			for (var i = 0; i < iWeeksToNavigate; i++) {
				if (iDirection > 0) {
					// we are moving FORWARD on the week numbers
					dateTemp.setDate(dateTemp.getDate() + 7);
				} else {
					// we are moving BACKWARD on the week numbers
					dateTemp.setDate(dateTemp.getDate() - 7);
				}

				var iWeekNumber = this.getUILogic().getWeekNo(dateTemp);
				aValidWeekNumbers.push(iWeekNumber);
			}
			return aValidWeekNumbers;
		},
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		// getWeek: function (date) {
		// 	return Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
		// },

		// calcWeek: function (today, weeks, type, data) {
		// 	var i = 1;
		// 	var now = today.getTime();
		// 	var oneWeek = 7 * 24 * 60 * 60 * 1000;
		// 	if (type > 0) {
		// 		for (i = 1; i <= weeks; i++) {
		// 			data.push(this.getUILogic().getWeekNo(new Date(now + oneWeek * i)));
		// 		}
		// 	} else {
		// 		for (i = 1; i <= weeks; i++) {
		// 			data.push(this.getUILogic().getWeekNo(new Date(now - oneWeek * i)));
		// 		}
		// 	}
		// 	return data;
		// },
		// // <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		getsubAccount: function () {
			return window.location.host.split("-")[1].split(".")[0];
		},

		getModels: function () {
			return models;
		},

		getUILogic: function () {
			return this._uilogic;
		},

		getText: function (i18n) {
			return this.getTools().getText(i18n);
		},

		showMessage: function (messageI18n, type, isText) {
			var that = this;

			if (!type) {
				type = "error";
			}

			return new Promise(function (resolve, reject) {

				var message = messageI18n;
				if (!isText) {
					message = that.getText(messageI18n);
				}

				MessageBox[type](
					message, {
						styleClass: "",
						onClose: resolve
					}
				);
			});
		},

		showMessageToast: function (messageI18n, isText) {
			var that = this;

			return new Promise(function (resolve, reject) {

				var message = messageI18n;
				if (!isText) {
					message = that.getText(messageI18n);
				}
				MessageToast.show(message);

			});
		},

		/*setControlModelProp: function (prop, value) {
			this.getModel("ControlModel").setProperty("/" + prop, value);
		},*/

		getTools: function () {
			return this._tools;
		},

		disableRequestBusy: function (disabled) {
			this._busyDisabled = disabled;
		},

		loadAggregDistribution: function (reportingControl, filterOnTopNumber) {

			var component = this;
			var topNumber = filterOnTopNumber;
			var startYear = reportingControl.searchCriteria.startYear;
			var startMonth = reportingControl.searchCriteria.startMonth;
			var startDate = new Date(Date.UTC(startYear, (startMonth - 1), 1));

			var endYear = reportingControl.searchCriteria.endYear;
			var endMonth = reportingControl.searchCriteria.endMonth;
			var endDate = new Date(Date.UTC(endYear, endMonth, 0));

			var dateErrorMsg = this.getI18ModelText("reporting-mandatory-fields-error");

			if (!topNumber) {
				topNumber = 0;
			}

			return new Promise(function (resolve, reject) {

				var validateEmptyField = function (field) {
					if (!field) {
						return true;
					}

					return false;
				};

				var innerSuccess = function (data) {
					component.getTools().hideBusy(0);
					resolve(data);
				};

				var innerFailure = function (data) {
					component.getTools().hideBusy(0);
					reject(data);
				};

				if (validateEmptyField(reportingControl.searchCriteria.startDate))
					return reject(dateErrorMsg);

				if (validateEmptyField(reportingControl.searchCriteria.endDate))
					return reject(dateErrorMsg);

				component.getTools().showBusy(0);
				var modelCall = component.getModel("SAP");

				modelCall.setUseBatch(component.appconfig.batchCalls);
				modelCall.callFunction("/getReportEmployeeDataPeriodAggrigated", {

					urlParameters: {
						startDate: startDate,
						endDate: endDate,
						aggrOnActivity: reportingControl.searchCriteria.aggrOnActivity,
						aggrOnProject: reportingControl.searchCriteria.aggrOnProject,
						aggrOnWBS: reportingControl.searchCriteria.aggrOnWBS,
						filterOnTopNumber: filterOnTopNumber,
						employeeNumber: reportingControl.searchCriteria.selectedKey,
						UUID: Utils.guid()
					},
					success: innerSuccess,
					error: innerFailure
				});
			});

		},

		loadEmployeeAggregDistribution: function () {

			var component = this;
			var util = component.getUtilLogic();
			var reportingControl = component.getModels().getReportingControlModel(component).getData();
			var filterOnTopNumber = 0;

			return new Promise(function (resolve, reject) {

				var succcess = function (data) {

					var filteredData = {
						"results": []
					};
					filteredData.results = util.removeZeroEntriesFromArray(data.results, "Catshours");
					filteredData.results = util.addPeriodField(filteredData.results, "Begda", "Period");
					resolve(filteredData);
				};

				component.loadAggregDistribution(reportingControl, filterOnTopNumber).then(succcess).catch(function (err) {

					if (err.responseText) {
						var error = JSON.parse(err.responseText);

					} else {
						error = {
							error: {
								message: {
									value: err
								}
							}
						};
					}

					MessageBox.error("" + error.error.message.value);

					reject();
				});
			});
		},

		loadComplianceAggregDistribution: function () {
			var component = this;
			var reportingControl = component.getModels().getReportingControlModel(component).getData();
			var filterOnTopNumber = 0;

			return new Promise(function (resolve, reject) {

				var succcess = function (data) {
					resolve(data);
				};

				component.callComplianceOdataService(reportingControl, filterOnTopNumber).then(succcess).catch(function (err) {

					var error = JSON.parse(err.responseText);
					MessageBox.error("" + error.error.message.value);
					reject();
				});
			});

		},

		callComplianceOdataService: function (reportingControl, filterOnTopNumber) {
			var component = this;
			var topNumber = filterOnTopNumber;

			var startYear = reportingControl.complianceSearchCriteria.startYear;
			var startMonth = reportingControl.complianceSearchCriteria.startMonth;
			var startDate = new Date(Date.UTC(startYear, (startMonth - 1), 1));

			var endYear = reportingControl.complianceSearchCriteria.endYear;
			var endMonth = reportingControl.complianceSearchCriteria.endMonth;
			var endDate = new Date(Date.UTC(endYear, endMonth, 0));

			var employeeNumber = "";

			if (!topNumber) {
				topNumber = 0;
			}

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {

					var util = component.getUtilLogic();
					var result = [];
					for (var i in data.results) {

						var element = {
							CpmpliancePct: parseFloat(data.results[i].Compliance).toFixed(2),
							Employee: data.results[i].Employee,
							Initials: data.results[i].Initials,
							// Month: util.getMonthText(data.results[i].Begda) + " " + data.results[i].Begda.getFullYear() // Ricardo Quintas (rqu) | 19/08/2019 | Time-Zone month fix
							Month: util.getMonthText(data.results[i].Begda) + " " + data.results[i].Begda.getUTCFullYear() // Ricardo Quintas (rqu) | 19/08/2019 | Time-Zone month fix
						};

						result.push(element);
					}

					data.results = result;
					component.getTools().hideBusy(0);
					resolve(data);
				};

				var innerFailure = function (data) {
					component.getTools().hideBusy(0);
					reject(data);
				};

				component.getTools().showBusy(0);
				var modelCall = component.getModel("SAP");

				modelCall.setUseBatch(component.appconfig.batchCalls);
				modelCall.callFunction("/GetReportManagerCompliance", {
					urlParameters: {
						startDate: startDate,
						endDate: endDate,
						/*	aggrOnOrgUnit: reportingControl.teamSearchCriteria.aggrOnOrgUnit,
							aggrOnActivity: reportingControl.teamSearchCriteria.aggrOnActivity,
							aggrOnProject: reportingControl.teamSearchCriteria.aggrOnProject,
							aggrOnWBS: reportingControl.teamSearchCriteria.aggrOnWBS,
							filterOnTopNumber: filterOnTopNumber,*/
						employeeNumber: employeeNumber,
						UUID: Utils.guid()
					},
					success: innerSuccess,
					error: innerFailure
				});
			});
		},

		loadGroupAggregDistribution: function (reportingControl, filterOnTopNumber) {

			var component = this;
			var topNumber = filterOnTopNumber;

			var startYear = reportingControl.teamSearchCriteria.startYear;
			var startMonth = reportingControl.teamSearchCriteria.startMonth;
			var startDate = new Date(Date.UTC(startYear, (startMonth - 1), 1));

			var endYear = reportingControl.teamSearchCriteria.endYear;
			var endMonth = reportingControl.teamSearchCriteria.endMonth;
			var endDate = new Date(Date.UTC(endYear, endMonth, 0));

			var dateErrorMsg = this.getI18ModelText("reporting-mandatory-fields-error");

			if (!topNumber) {
				topNumber = 0;
			}

			return new Promise(function (resolve, reject) {

				var validateEmptyField = function (field) {
					if (!field) {
						return true;
					}

					return false;
				};

				var innerSuccess = function (data) {
					component.getTools().hideBusy(0);
					resolve(data);
				};

				var innerFailure = function (data) {
					component.getTools().hideBusy(0);
					reject(data);
				};

				if (validateEmptyField(reportingControl.teamSearchCriteria.startDate))
					return reject(dateErrorMsg);

				if (validateEmptyField(reportingControl.teamSearchCriteria.endDate))
					return reject(dateErrorMsg);

				component.getTools().showBusy(0);
				var modelCall = component.getModel("SAP");

				modelCall.setUseBatch(component.appconfig.batchCalls);
				modelCall.callFunction("/getReportManagerDataPeriodAggrigated", {

					urlParameters: {
						startDate: startDate,
						endDate: endDate,
						aggrOnOrgUnit: reportingControl.teamSearchCriteria.aggrOnOrgUnit,
						aggrOnActivity: reportingControl.teamSearchCriteria.aggrOnActivity,
						aggrOnProject: reportingControl.teamSearchCriteria.aggrOnProject,
						aggrOnWBS: reportingControl.teamSearchCriteria.aggrOnWBS,
						filterOnTopNumber: filterOnTopNumber,
						employee: "",
						UUID: Utils.guid()
					},
					success: innerSuccess,
					error: innerFailure
				});
			});

		},

		loadTeamAggregDistribution: function () {

			var component = this;
			var util = component.getUtilLogic();
			var reportingControl = component.getModels().getReportingControlModel(component).getData();
			var filterOnTopNumber = 0;

			return new Promise(function (resolve, reject) {

				var succcess = function (data) {
					resolve(data);
				};

				component.loadGroupAggregDistribution(reportingControl, filterOnTopNumber).then(succcess).catch(function (err) {

					if (err.responseText) {
						var error = JSON.parse(err.responseText);

					} else {
						error = {
							error: {
								message: {
									value: err
								}
							}
						};
					}

					MessageBox.error("" + error.error.message.value);
					reject();
				});
			});
		},

		getRoles: function () {
			return this._roles;
		},

		getCatsConfigurator: function () {
			return this._catsConfigurator;
		},

		getUtilLogic: function () {
			return this._utilLogic;
		},

		getErrorHandler: function () {
			return this._errorHandler;
		},

		getI18ModelText: function (i18Text, argArray) {
			return this.getModel("i18n").getResourceBundle().getText(i18Text, argArray);
		}
	});
});