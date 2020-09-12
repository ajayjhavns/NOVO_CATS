sap.ui.define([
	"com/nn/cats/employee/controller/BaseController",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/ui/unified/DateTypeRange",
	"sap/ui/model/Filter",
	"com/nn/cats/employee/util/Formatter",
	"com/nn/cats/employee/util/Utils",
	"com/nn/cats/employee/classes/timesheet/Project",
	"com/nn/cats/employee/classes/timesheet/TimeSheet",
	"sap/ui/model/json/JSONModel",
	"sap/ui/layout/form/SimpleForm",
	"com/nn/cats/employee/classes/ErrorHandler",
	"sap/ui/unified/DateRange"
], function (BaseController, Dialog, Button, DateTypeRange, Filter, Formatter, Utils, Project, TimeSheet, JSONModel, SimpleForm,
	ErrorHandler, DateRange) {
	"use strict";

	return BaseController.extend("com.nn.cats.employee.controller.Main", {
		formatter: Formatter,

		onInit: function () {
			this._comp = this.getOwnerComponent();
			this._project = new Project(this._comp);
			this._weekNoChange = 0;

			this._dataHasChanged = false; // this variable will be used by the code that checks the exit without saving

			var that = this;

			// this code handles the exit without saving functionality
			$(window).bind('beforeunload', function (e) {
				if (that._dataHasChanged) {
					var message = "Data was changed but not saved. Are you sure you want to leave ?";
					that._dataHasChanged = false;
					e.returnValue = message;
					return message;
				}
			});

			// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 25
			sap.m.Input.prototype.onfocusin = function (oEvent) {
				if (this.getType() === "Number") {
					if (this.getValue() === 0 || this.getValue() === "0") {
						this.setValue("");
					}
				}
			};

			sap.m.Input.prototype.onfocusout = function (oEvent) {
				if (this.getType() === "Number") {
					if (this.getValue() === "" || this.getValue() === " ") {
						this.setValue("0");
						var sId = this.getId();
						if (sId.search("monday") !== -1 || sId.search("tuesday") !== -1 || sId.search("wednesday") !== -1 || sId.search("thursday") !==
							-1 || sId.search("friday") !== -1 || sId.search("saturday") !== -1 || sId.search("sunday") !== -1) {
							this.fireChangeEvent();
						}
					}
				}
			};
			// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 25

			var oRouter = this.getRouter();
			var oTarget = oRouter.getTarget("TargetMain");
			oTarget.attachDisplay(function (oEvent) {
				this._oData = oEvent.getParameter("data"); // store the data
			}, this);

			var oModel = new sap.ui.model.json.JSONModel();
			this._comp.setModel(oModel, "userapi");
			oModel.loadData("/services/userapi/currentUser");

			this._comp._isTest = false;
			this._timesheet = new TimeSheet(this._comp, this._project);
			this._initializeValues(true);

			this._comp.setModel(this._timesheet.getModel(), "timesheet");
			this.getView().setModel(this._timesheet.getModel());

			this.refreshColumnHeaders(); // Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 43
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("TargetMain").attachPatternMatched(this.onObjectMatched, this);
		},

		onBeforeRendering: function () {
			this.onObjectMatched();
		},

		onObjectMatched: function (oEvent) {
			if (this._comp.getModel("device").getData().isPhone) {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("TargetMainMobile");
				this._dataHasChanged = false;
			} else {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("TargetMain");
				this._dataHasChanged = false;
			}
		},

		/* Filter visible items = not deleted ones */
		_addFilter: function () {
			var filters = [];
			var filter = new sap.ui.model.Filter("visible", sap.ui.model.FilterOperator.NE, false);
			filters.push(filter);

			var filt = new sap.ui.model.Filter({
				filters: filters,
				and: false
			});
			var aFilters = [];
			aFilters.push(filt);

			// update list binding
			var control = "";
			if (!this._comp.getModel("device").getData().isPhone) {
				control = this.getView().byId("table");
			} else {
				control = this.getView().byId("resultlist");
			}
			try {
				var binding = control.getBinding("items");
				binding.filter(aFilters);
				//this.getView().getModel().refresh();
			} catch (err) {
				//nothing
			}

		},

		_initializeValues: function (setBusy) {
			var that = this;
			this._dataHasChanged = false;
			//this.getView().setModel(this._timesheet.getModel());
			if (setBusy) {
				this._comp.getTools().showBusy(0);
			}
			this._timesheet.loadData().then(function (response) {
					that._comp.getTools().showBusy(0);
					that._hasErrors = false;
					that.tempData = response;
					if (response) {
						return that._timesheet._getProjectDetails(response).then(function (arr) {
							var model = that._timesheet.getModel("timesheet");
							var aData = model.getData();
							aData.TimeSheet = that.tempData;
							model.setData(aData);
							that._addFilter(that._timesheet.getModel());
							that._addTemplateProjects();
							that.getView().setModel(that._timesheet.getModel());
							//return that._comp.getTools().hideBusy(0);
						});
					} else {
						that._clearTimeSheet(that);
						//return that._comp.getTools().hideBusy(0);
					}
					if (setBusy) {
						return that._comp.getTools().hideBusy(0);
					}

				})
				.catch(function (val) {
					that._clearTimeSheet(that);
					that._comp.getTools().hideBusy(0);
					//that._comp.getErrorHandler().showMessage(val);
				});
		},

		_clearTimeSheet: function (that, enable) {
			that.getView().getModel().getData().TimeSheet = [];
			that.getView().getModel().getData().weekTotals = [];
			that.getView().getModel().getData().dayTotal = "0";
			this._isChanged = false;
			that._setTimeSheetEnabled(enable);
			//that.getView().getModel().refresh();
		},

		onAfterRendering: function () {
			this._updateViewModel();
		},

		onExit: function () {},

		_updateViewModel: function () {
			this.getView().setModel(this._timesheet.getModel());
			this.getView().getModel().refresh();
		},

		handleDateChange: function (oEvent) {
			var sFrom = this.getView().getModel().getData().weekStartDate;
			var bValid = oEvent.getParameter("valid");
			var oDRS = oEvent.getSource();

			var validWeek = this._comp.getUILogic().isWeekValid(sFrom);
			if (validWeek && bValid) {
				oDRS.setValueState(sap.ui.core.ValueState.None);
				this._setTimeSheetEnabled(true);
				//Set Date interval and DatePicker
				this._weekChange(oEvent, null, sFrom);
			} else {
				if (!validWeek) {
					this._setTimeSheetEnabled(false);
					this.byId(oEvent.getParameter("id")).setValueStateText(this._comp.getText("war_timesheetNotAllowedWeek"));
				}
				oDRS.setValueState(sap.ui.core.ValueState.Error);
			}

		},

		_updateText: function (oCalendar) {
			var oCalendar = this.byId("calendar");
			oCalendar.removeAllSelectedDates();
			oCalendar.addSelectedDate(new DateRange({
				startDate: new Date()
			}));
		},

		onDateChangeMobile: function (oEvent) {
			/*if (this._comp.getModel("ConfigModel").getData().enabled == undefined || this._comp.getModel("ConfigModel").getData().enabled) {*/
			//if (!this._hasErrors) {
			var selectedDate = oEvent.getSource().getSelectedDates()[0].getStartDate();
			var oCalendar = oEvent.getSource(); //,
			this.selDate = new Date(selectedDate);
			this.selDate.setHours(15);
			var validWeek = this._comp.getUILogic().isWeekValid(new Date(this.selDate));
			if (validWeek) {
				this._setTimeSheetEnabled(true);
				var list = this.byId("resultlist").getItems();
				list.forEach(function (item) {
					item.removeStyleClass("gavdi-listitem-noborder");
				});
				this._doDayChangeMobile(oEvent, this.selDate);
				oCalendar = this.getView().byId("cats-calendar");
				oCalendar.removeAllSelectedDates();
				oCalendar.addSelectedDate(new DateRange({
					startDate: this.selDate
				}));
			} else {
				this._clearTimeSheet(this, false);
				this._comp.showMessageToast("war_timesheetNotAllowedWeek");
			}

			/*} else {
				Utils.displayErrorPopup(this._comp.getText("war_timesheetHasErrors"));
			}*/
			//}
		},

		_doDayChangeMobile: function (oEvent, date) {

			var that = this;
			var triggerEvent = Object.assign({}, oEvent);

			var nextDay = function () {
				//Then go to the new week
				that.getView().getModel().getData().dayTotal = "0";
				that._timesheet.calcDates(triggerEvent, 0, date);
				that._initializeValues(true);
			};

			//First save changes
			this.saveTimeSheet(true).then(nextDay);
		},

		_setTimeSheetEnabled: function (bool) {
			this._comp.getModel("ConfigModel").getData().enabled = bool;
			//this._comp.getModel("ConfigModel").refresh();
		},

		onWeekBefore: function (oEvent) {
			var date = this._timesheet.getNewDate(oEvent, -7);
			this._weekNoChange--;
			if (this._comp.getUILogic().isWeekValid(date, this._weekNoChange)) {
				this._weekChange(oEvent, -7);
			} else {
				this._comp.showMessageToast("war_timesheetNotAllowedDateBack");
			}
		},

		onWeekAfter: function (oEvent) {
			var date = this._timesheet.getNewDate(oEvent, +7);
			this._weekNoChange++;
			if (this._comp.getUILogic().isWeekValid(date, this._weekNoChange)) {
				this._weekChange(oEvent, +7);
			} else {
				this._comp.showMessageToast("war_timesheetNotAllowedDateForward");
			}
		},

		_weekChange: function (oEvent, days, date) {

			var that = this;
			var triggerEvent = Object.assign({}, oEvent);

			var nextWeek = function () {
				//Then go to the new week
				try { // Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 43
					that._timesheet.calcDates(triggerEvent, days, date);
				} finally {
					that._initializeValues(true);
					that.refreshColumnHeaders(); // Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 43
				}
			};

			//First save changes
			if (this.getView().getModel().getData().TimeSheet !== null) {
				this.saveTimeSheet(true).then(nextWeek);
			} else {
				nextWeek();
			}

		},

		onDeleteRow: function (oEvent) {
			var idx = oEvent.getSource().getBindingContext().getPath();
			idx = idx.replace("/TimeSheet/", "");
			var data = this.getView().getModel().getData().TimeSheet;
			if (!this._comp.getModel("device").getData().isPhone) {
				this._timesheet.markRowAsDeleted(data[idx], data, idx);
				this._timesheet.calcTotals(data, true);
			} else {
				data[idx].visible = false;
				if (data[idx].Counter) {
					data[idx].saveStatus = this._comp.appconfig.cats.del;
				} else {
					data.splice(idx, 1); //just remove the element since it's a new one that needs to be deleted
					//this._hasErrors = false;
				}
				this._timesheet.calcTotalsMobile(data);
				this._addFilter(this._timesheet.getModel());
			}
			this._timesheet._isNewUserTemplate = true;
			this._isChanged = true;
			this._hasErrors = false;
			this.getView().getModel().refresh(true);
		},

		/*checkForNotSavedEntries: function () {
			var that = this;
			var arr;
			arr = jQuery.grep(this._timesheet.TimeSheet, function (a) {
				return a.saveStatus === that._comp.appconfig.cats.new || a.saveStatus === that._comp.appconfig.cats.upd || a.saveStatus ===
					that._comp.appconfig.cats.del;
			});
			return arr;
		},*/

		onSave: function (oEvent) {
			this.saveTimeSheet(false);
		},

		saveTimeSheet: function (isDateChanged) {
			var that = this;

			return new Promise(function (resolve, reject) {

				if (!that._hasErrors) {
					that._comp.getTools().showBusy(0);
					that._timesheet.save().then(function (response) {
							if (response) {
								that._saveTemplate();
								if (!isDateChanged) {
									that._initializeValues(false);
								}
								that._comp.getTools().hideBusy(0);

								if (response === "Done!") {
									//that._comp.showMessageToast(response, false);
									that._comp.showMessageToast("info_timesheet_saved", false);
								}
							} else {
								that._comp.getTools().hideBusy(0);
							}
							resolve();
						})
						.catch(function (err) {
							that._comp.getTools().hideBusy(0);
							that._hasErrors = true;
							try {
								var recordTxt = "";

								try {
									recordTxt = recordTxt + that._comp.getUtilLogic().getWeekDayText(err.object.Workdate) + " - ";
									recordTxt = recordTxt + "WBS: " + err.object.WbsElement + " ";
									recordTxt = recordTxt + "(" + err.object.Acttype + ")" + "\n\n";

								} catch (err) {
									//do nothing
								}

								Utils.displayErrorPopup(recordTxt + that._comp.getText("err_timesheet_not_saved") + "\n\n" + that._comp.getErrorHandler().getMessage(
									err));
							} catch (err) {
								Utils.displayErrorPopup(that._comp.getText("err_timesheet_not_saved"));
							}

						});
				} else {
					that._comp.showMessageToast("war_timesheetHasErrors");
					reject();
				}

			});
			/*} else {
				var result = this.checkForNotSavedEntries();
				if (result && result.length > 0) {
					if (this._timesheet._isNewUserTemplate) {
						that._saveTemplate();
					} else {
						Utils.displayErrorPopup(that._comp.getText("err_timesheet_pls_correct") + "\n\n" + result[0].projectNumber + " " + result[0].projectDescription);
					}
				} else {
					that._saveTemplate();
				}
				
			}*/

		},

		_saveTemplate: function (oEvent) {
			var data = this.getView().getModel().getData().TimeSheet;
			if (data && this._timesheet._isNewUserTemplate) {
				this._comp.getCatsConfigurator().saveUserProjects(data);
				this._timesheet._isNewUserTemplate = false;
			}
		},

		_addTemplateProjects: function () {
			var that = this;

			var data = that._timesheet.TimeSheet;
			//this._comp.getTools().showBusy(0);
			this._comp.getCatsConfigurator().loadUserProjects().then(function (response) {
					if (response) {
						var projects = JSON.parse(JSON.stringify(response.results));

						// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 42
						for (var ii = 0; ii < projects.length; ii++) {
							if (projects[ii].wbsDescription.indexOf("B10") >= 0) {
								projects[ii].wbsDescription = projects[ii].projectDescription.trim();
							}
						}
						// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 42

						for (var i in projects) {
							var project = projects[i];
							var key = project.wbs + project.activityType;

							if (!that._comp.getModel("device").getData().isPhone) {
								if (data && !data[key]) {
									that._addTemplateRow(project, that);
								}
							} else {
								var found = data.find(function (element) {
									var innerKey = element.wbs + element.activityType;
									return innerKey == key;
								});
								if (!found) {
									that._addTemplateRow(project, that);
								}
							}
						}
					}
					//that._comp.getTools().hideBusy(0);

				})
				.catch(function (val) {
					that._clearTimeSheet(that);
					//that._comp.getTools().hideBusy(0);
					that._comp.getErrorHandler().showMessage(val);
				});
		},

		_addTemplateRow: function (project, that) {
			var obj = that._getNewRow(project.projectDescription, project.activityType, project.activityName, project.projectNumber,
				project.trialId,
				project.wbs, project.wbsDescription);
			that._addProjectToTimesheet(obj, that._comp.appconfig.cats.empty);
		},

		_onResetTimeSheet: function (oEvent) {
			this._initializeValues();
		},

		validateInput: function (oEvent) {
			this._dataHasChanged = true;
			var oModel = this.getView().getModel();
			var sRow = oEvent.getSource().getBindingContext().getPath();
			var projectRow = oModel.getProperty(sRow);
			var value = oEvent.getParameters().value;

			// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 25
			if (value === undefined) {
				value = "";
			}
			// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 25

			this._replaceComma(value, oEvent);

			if (value !== "" && !this._comp.getUILogic().isNumberFieldValid(value)) { //OK
				this.byId(oEvent.getParameter("id")).setValueState(sap.ui.core.ValueState.Error);
				this._hasErrors = true;
			} else {
				if (value === "" && this.byId(oEvent.getSource().getId())) {
					this.byId(oEvent.getSource().getId()).setValue(0);
					value = "0";
					this._updateValue(projectRow, oEvent, sRow);
				} else {
					this._updateValue(projectRow, oEvent, sRow);
					if (!this._comp.getUILogic().isMaxHoursValid(oEvent.getSource().getId(), value, oModel.getData().weekTotals)) {
						this.byId(oEvent.getParameter("id")).setValueState(sap.ui.core.ValueState.Error);
						this.byId(oEvent.getParameter("id")).setValueStateText(this._comp.getText("err_maxHours"));
						this._hasErrors = true;
						return;
					}
				}
				this.byId(oEvent.getParameter("id")).setValueState(sap.ui.core.ValueState.None);
				this.byId(oEvent.getParameter("id")).setValueStateText("");
				this._doCommonUpdate();
				//this._updateValue(projectRow, oEvent, sRow);
			}
		},

		validateInputMobile: function (oEvent) {
			this._dataHasChanged = true;
			var oModel = this.getView().getModel();
			var sRow = oEvent.getSource().getBindingContext().getPath();
			var element = oModel.getProperty(sRow);
			var value = oEvent.getParameters().value;

			if (value !== "" && !this._comp.getUILogic().isNumberFieldValid(value)) { //OK
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
				this._hasErrors = true;
			} else {
				if (value === "") {
					this.byId(oEvent.getSource().getId()).setValue("0");
					value = "0";
				}

				this._replaceCommaMobile(value, oEvent);
				var isValid = this._updateValueMobile(element, oEvent, sRow);
				if (!isValid) {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
					oEvent.getSource().setValueStateText(this._comp.getText("err_maxHours"));
					this._hasErrors = true;
					return;
				}
				oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
				oEvent.getSource().setValueStateText("");
				if (element.saveStatus === undefined) {
					element.saveStatus = this._comp.appconfig.cats.upd;
				} else if (element.saveStatus === this._comp.appconfig.cats.empty && parseFloat(element.Catshours, 10) > 0) {
					element.saveStatus = this._comp.appconfig.cats.new;
				}
				this._doCommonUpdate();
			}
		},

		_doCommonUpdate: function () {
			this._hasErrors = false;
			this._isChanged = true;
			this._updateViewModel();
		},

		_replaceComma: function (value, oEvent) {
			if (value !== "") {
				var val = (value.replace(",", "."));
				this.byId(oEvent.getParameter("id")).setValue(val);
			}
		},

		_replaceCommaMobile: function (value, oEvent) {
			var val = (value.replace(",", "."));
			val = Formatter.toRoundedDecimal(val);
			oEvent.getSource().setValue(val);
		},

		_updateValue: function (projectRow, oEvent, sRow) {
			var oModel = this.getView().getModel();
			this._timesheet.calcProjectTotal(sRow.split("/TimeSheet/")[1]);
			this._timesheet.calcTotals(oModel.getData().TimeSheet, true);
		},

		_updateValueMobile: function (projectRow, oEvent, sRow) {
			var oModel = this.getView().getModel();
			return this._timesheet.calcTotalsMobile(oModel.getData().TimeSheet);
		},
		/* PROJECT DIALOG */
		_getProjectDefaultModel: function () {

			this._comp.appconfig.defaultActType = this._comp.appconfig.defaultActTypeKey;

			var projectData = {
				projectID: "",
				activity: {
					"Acttype": this._comp.appconfig.defaultActType,
					"Name": this._comp.appconfig.defaultActName
				}
			};
			var oModelProject = new JSONModel(projectData);
			return oModelProject;
		},

		onAddRow: function (oEvent) {
			var oModelProject = this._getProjectDefaultModel();
			//if (!this.projectDialog) {
			var actModel = this._getValidActTypes();
			this.projectDialog = sap.ui.xmlfragment("com.nn.cats.employee.view.fragments.ProjectDialog", this);
			this.projectDialog.setModel(oModelProject, "mProject");
			this.projectDialog.setModel(actModel, "modelActtype");
			this.projectDialog.setModel(this._comp.getModel("AppConfig"), "AppConfig");
			this.projectDialog.setModel(this._project.getModel(), "modelProjects");
			this.projectDialog.setModel(this.getView().getModel("i18n"), "i18n");
			//	} else {
			//this.projectDialog.getContent()[0]._aElements[1].getAggregation("items")[1].getBinding("items").filter([]);
			//	}
			this.projectDialog.open();
		},

		_getValidActTypes: function () {
			var actTypes = this._comp.getModel("ActivityTypes").getData();
			var projectActTypes = [];
			for (var i in actTypes) {
				//only entries that the administrator has marked as visible
				//if (actTypes[i].research === true) { 
				if (actTypes[i].VisibleFlag === true) {
					projectActTypes.push(actTypes[i]);
				}
			}
			return new JSONModel(projectActTypes);
		},

		// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 43
		// Combines day of the week name, with current date for each column.
		// For example "Mon 4-Feb"
		refreshColumnHeaders: function () {
			var oTimesheetModel = this._comp.getModel("timesheet");
			var aDays = oTimesheetModel.getProperty("/days");

			var str = "";

			// returns the UTC date in format "dd-Mmm"
			var formatDataString = function (dat) {
				var aMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				var sRes = dat.getUTCDate() + "-" + aMonth[dat.getUTCMonth()];
				return sRes;
			};

			// Monday
			str = this._comp.getI18ModelText("timesheet.tab_mon") + ".\n " + formatDataString(aDays[0]);
			oTimesheetModel.setProperty("/tab_mon", str);

			// Tuesday
			str = this._comp.getI18ModelText("timesheet.tab_tue") + ".\n " + formatDataString(aDays[1]);
			oTimesheetModel.setProperty("/tab_tue", str);

			// Wednesday
			str = this._comp.getI18ModelText("timesheet.tab_wed") + ".\n " + formatDataString(aDays[2]);
			oTimesheetModel.setProperty("/tab_wed", str);

			// Thursday
			str = this._comp.getI18ModelText("timesheet.tab_thu") + ".\n " + formatDataString(aDays[3]);
			oTimesheetModel.setProperty("/tab_thu", str);

			// Friday
			str = this._comp.getI18ModelText("timesheet.tab_fri") + ".\n " + formatDataString(aDays[4]);
			oTimesheetModel.setProperty("/tab_fri", str);

			// Saturday
			str = this._comp.getI18ModelText("timesheet.tab_sat") + ".\n " + formatDataString(aDays[5]);
			oTimesheetModel.setProperty("/tab_sat", str);

			// Sunday
			str = this._comp.getI18ModelText("timesheet.tab_sun") + ".\n " + formatDataString(aDays[6]);
			oTimesheetModel.setProperty("/tab_sun", str);
		},
		// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 43

		//PROJECT DIALOG		
		handleSearch: function (evt, action) {
			this.getView().getModel("AppConfig").setProperty("/listVisible", true); //Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 38
			var that = this;
			//when search is first //var oList = this.projectDialog.getContent()[0]._aElements[1].mAggregations.items[0]; 
			var oList = this.projectDialog.getContent()[0]._aElements[1].mAggregations.items[0];
			this._project.doFuzzySearch(evt, action, oList);
		},

		onProjectDialogOkButton: function (oEvent) {
			var mProjectModel = this.projectDialog.getModel("mProject").getData();

			if (!(mProjectModel.activitytype || mProjectModel.activity.Acttype)) {
				this._comp.showMessageToast("select_valid_activity_type");
				return;
			}

			if (mProjectModel.Project) {
				// Get json array from model
				var obj = this._getNewRow(mProjectModel.Project.projectDescription, mProjectModel.activity.Acttype, mProjectModel.activity.Name,
					mProjectModel.Project
					.projectNumber, mProjectModel.Project.trialId, mProjectModel.Project.wbsCode, mProjectModel.Project.wbsDescription);
				/*	var obj = this._getNewRow(mProjectModel.Project.projectDescription, mProjectModel.activity.Acttype, mProjectModel.activity.Name,
						mProjectModel.Project
						.projectNumber, mProjectModel.Project.trialId, mProjectModel.Project.wbsCode, mProjectModel.Project.wbsDescription);	*/
				this._addProjectToTimesheet(obj, this._comp.appconfig.cats.new);
				this._timesheet._isNewUserTemplate = true;
				this._cancelDialog();
			} else {
				this._comp.showMessageToast("war_noProjectSelected");
			}
		},

		_addProjectToTimesheet: function (obj, status) {
			var oModel = this._timesheet.getModel();
			var data = oModel.getData().TimeSheet;
			if (!this._comp.getModel("device").getData().isPhone) {
				this._timesheet.createDayObjects(obj);
				if (data) {

					var key = obj.WbsElement + obj.Acttype;

					if (data[key] && data[key].total > 0) { //if not we are overwriting the existing line
						//this._comp.showMessageToast("info_timesheet_rowExists");
						//this._comp.showMessage("info_timesheet_rowExists");
					} else {
						data[key] = obj;
						this._timesheet.calcTotals(data, true);
					}
				} else {
					var temp = [obj];
					this._timesheet.adjustTableData(temp);
				}
			} else {

				var key = obj.WbsElement + obj.Acttype;
				var found = data.find(function (element) {
					var innerKey = element.WbsElement + element.Acttype;
					return innerKey == key;
				});

				if (!found) {
					obj.WorkDate = oModel.getData().weekStartDate;
					obj.saveStatus = status;
					data.push(obj);
					this.getView().getModel().getData().TimeSheet = data;
					this.getView().getModel().refresh(); //if not the data is not shown on load (mobile)
				}
			}
		},

		_getNewRow: function (projDesc, actType, actName, projNum, trialId, wbs, wbsDesc) {
			var obj = {};
			obj.WorkDate = "";
			obj.Catshours = "";
			obj.projectDescription = projDesc;
			obj.Acttype = actType;
			obj.ActName = actName;
			obj.projectNumber = projNum;
			obj.trialId = "";
			if (trialId) {
				obj.trialId = "Trial Id: " + trialId;
				obj.isTrial = true;
			} else {
				obj.isTrial = false;
			}
			obj.WbsElement = wbs;
			obj.wbsDescription = wbsDesc;
			obj.visible = true;
			return obj;
		},

		onProjectDialogCancelButton: function (oEvent) {
			this._cancelDialog();
			//oEvent.getSource().getParent().close();
		},

		_cancelDialog: function () {
			//this.projectDialog.getContent()[0]._aElements[1].mAggregations.items[0].setValue(""); 
			this.projectDialog.getContent()[0]._aElements[1].mAggregations.items[0].setValue("");
			var data = this._project.getModel().getData();
			data = "";
			this._project.getModel().setData(data);
			this.projectDialog.getModel("modelProjects").refresh(true);
			this.projectDialog.close();
			this.projectDialog.destroy();
		},

		onProjectActivityChange: function (oEvent) {

			var mProjectModel = this.projectDialog.getModel("mProject").getData();

			try {
				var path = oEvent.getSource().getSelectedItem().getId();
				var index = parseInt(path.substring(path.lastIndexOf("-") + 1, path.length), 10);
				mProjectModel.activity = this.projectDialog.getModel("modelActtype").getData()[index];
				//var selectedItem = oEvent.getSource().getSelectedItem();
				//mProjectModel.activity = selectedItem.getKey();
				mProjectModel.activitytype = mProjectModel.activity.Acttype; //mProjectModel.activity.type;
				mProjectModel.activityName = mProjectModel.activity.Name; //mProjectModel.activity.name;

			} catch (err) {
				mProjectModel.activitytype = undefined; //mProjectModel.activity.type;
				mProjectModel.activityName = undefined; //mProjectModel.activity.name;
				this._comp.showMessageToast("invalidate_activity_type");
			}
		},

		onSelectProject: function (oEvent) {
			this.getView().getModel("AppConfig").setProperty("/listVisible", false); //Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 38

			var itemContextPath = oEvent.getParameter("listItem").getBindingContextPath();
			var index = parseInt(itemContextPath.substring(itemContextPath.lastIndexOf("/") + 1, itemContextPath.length), 10);

			var mProjectModel = this.projectDialog.getModel("mProject").getData();
			this._selectedItem = oEvent.getSource().getSelectedItem();
			mProjectModel.Project = this.projectDialog.getModel("modelProjects").getData()[index];

			// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 38
			var str = mProjectModel.Project.projectNumber + " " + mProjectModel.Project.wbsDescription;
			this.getView().getModel("AppConfig").setProperty("/searchValue", str);
			// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 38

			// this.onProjectDialogOkButton(oEvent); //Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 38
		},
		/* PROJECT DIALOG end  */

		_onShowReports: function (oEvent) {
			this._comp.getTools().showBusy(0);
			this.getRouter().navTo("Reporting");
		},

		_onSkillType: function (oEvent) {
			var appname = this._comp.appconfig.skilltypeApp.name;
			var subacc = this._comp.getsubAccount();
			var rest = window.location.host.split(subacc)[1];
			window.open(appname + subacc + rest, "_blank");
		},

		onOpenLink: function (oEvent) {
			var url = this._comp.appconfig.help.timesheet;
			window.open(url, "_blank");
		},

		iterationCopy: function (src) {
			var target = {};
			for (var prop in src) {
				if (src.hasOwnProperty(prop)) {
					target[prop] = src[prop];
				}
			}
			return target;
		}
	});
});