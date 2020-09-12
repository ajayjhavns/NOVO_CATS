sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	'sap/m/MessageBox',
	"sap/ui/model/json/JSONModel",
	"com/nn/cats/employee/model/models",
	"com/nn/cats/employee/util/Utils",
], function (jQuery, BaseObject, MessageToast, MessageBox, JSONModel, models, Utils) {

	var TimeSheet = BaseObject.extend("com.nn.cats.employee.classes.TimeSheet", {
		constructor: function (comp, proj) {

			this._comp = comp;
			this._project = proj;
			this._isNewUserTemplate = false;
			this.isOnlyAbsenceAllowed = false;

			if (this._comp._isTest) {
				this.weekStartDate = new Date();
				this.firstDateValueDRS2 = new Date(2018, 1, 8);
				this.secondDateValueDRS2 = new Date(2018, 1, 14);
			} else {
				this.weekStartDate = new Date();
				this.firstDateValueDRS2 = new Date();
				this.secondDateValueDRS2 = new Date();
			}
			this.model = new JSONModel();
			this.setDates(this.firstDateValueDRS2);
			this.model.setData(this);
		},

		getModel: function () {
			return this.model;
		},

		setModel: function (data) {
			this.model.getData().TimeSheet = data;
		},

		loadData: function () {
			var that = this;
			var modelCall = that._comp.getModel("SAP");
			modelCall.setUseBatch(false); //no batch

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {
					var newdata = that._cleanUpData(data.results);
					if (!that._comp.getModel("device").getData().isPhone) {
						//newdata = that.adjustTableData(newdata);
						newdata = that.adjustData(newdata);
					} else {
						that.calcTotalsMobile(newdata);
					}
					resolve(newdata);
				};
				var innerReject = function (error) {
					var errorObj = JSON.parse(error.responseText);
					if (errorObj.error.innererror.errordetails[0]) {
						if (errorObj.error.innererror.errordetails[0].severity === "info") {
							that._comp.showMessageToast(errorObj.error.message.value, true);
							return resolve();
						} else {
							reject(error);
						}
					}
					reject(error);
				};

				var dates = that.model.getData();
				// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
				// var date1 = that._comp._uilogic.getTimeZoneDate(dates.weekStartDate, "start", that._comp.getModel("device").getData().isPhone);
				// var date2 = that._comp._uilogic.getTimeZoneDate(dates.weekEndDate, "end", that._comp.getModel("device").getData().isPhone);
				// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
				var date1;
				var date2;

				if (that._comp.getModel("device").getData().isPhone) {
					// for Mobile both date1 and date2 should point to the same date
					date1 = new Date(dates.weekStartDate);
					date2 = new Date(dates.weekStartDate);
				} else {
					date1 = new Date(dates.weekStartDate);
					date2 = new Date(dates.weekEndDate);
				}
				// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				modelCall.callFunction("/getTimeSheetInPeriod", {
					urlParameters: {
						startDate: date1,
						endDate: date2,
						UUID: Utils.guid()
					},
					success: innerSuccess,
					error: innerReject
				});
			});
		},

		getMonthAbrrByIndex: function (index) {
			return this._comp.getI18ModelText("abbrmonth" + index);
		},

		formatDateToString: function (date) {
			return date.getUTCDate() + " " + this.getMonthAbrrByIndex(date.getUTCMonth() + 1) + " " + date.getUTCFullYear(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			// return date.getDate() + " " + this.getMonthAbrrByIndex(date.getMonth() + 1) + " " + date.getFullYear(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		},

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		// This function returns the first date (monday) or last date (sunday) of a week.
		// The passing arguments are: a date, and the sType (which could be "start" or "end")
		getWeekDate: function (dateObj, sType) {
			var dateUTC = this._comp._uilogic.getDateInUTC(dateObj, sType);
			var dayUTC = dateUTC.getUTCDay();

			// calculate first day of the week (monday)
			if (sType === "start") {
				dateUTC.setDate(dateUTC.getDate() - dayUTC + 1);
			}

			// calculate last day of the week (sunday)
			if (sType === "end") {
				var iDaysDif = 7 - dayUTC;
				dateUTC.setDate(dateUTC.getDate() + iDaysDif);
			}

			return dateUTC;
		},
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		setDates: function (dateFrom) {

			if (!this._comp.getModel("device").getData().isPhone) {
				// Dates for DESKTOP
				// Determine first and last day of week, weekStartDate should ALWAYS be a Monday
				this.weekStartDate = this.getWeekDate(dateFrom, "start");
				this.weekEndDate = this.getWeekDate(dateFrom, "end");
			} else {
				// Dates for MOBILE
				// Basically weekStartDate and weekEndDate should have the same date
				this.weekStartDate = new Date(dateFrom);
				this.weekEndDate = new Date(dateFrom);
				this.weekStartDate.setHours(15, 0, 0, 0);
				this.weekEndDate.setHours(23, 59, 59, 0);
			}

			// define some other global variables
			this.activeYear = this.weekEndDate.getUTCFullYear();
			this.activeWeek = this._comp._uilogic.getWeekNo(dateFrom);
			this.weekStartDateString = this.formatDateToString(this.weekStartDate);
			this.weekEndDateString = this.formatDateToString(this.weekEndDate);

			// This code will initialize the days array
			// First element of this array should ALWAYS be a Monday,
			// we start with weekStartDate, and then just keep adding 1 day
			this.days = [];
			for (var i = 0; i < 7; i++) {
				var dateDay = new Date(this.weekStartDate);
				dateDay.setDate(dateDay.getDate() + i);
				this.days.push(dateDay);
			}

			this.model.setData(this);
		},
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue - The code below for setDates, just sucks
		// setDates: function (sFrom) {
		// 	var d = new Date(sFrom);
		// 	d.setHours(0, 0, 0);
		// 	d.setDate(d.getDate() + 4 - (d.getDay() || 7));
		// 	var dEnd = new Date(d.getTime());
		// 	//var now = new Date(sFrom);
		// 	//var oneWeek = 7 * 24 * 60 * 60 * 1000;
		// 	this.activeWeek = this._comp._uilogic.getWeekNo(new Date(sFrom));
		// 	//this.activeWeek = this._comp._uilogic.getWeekNo(d);//Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
		// 	var first = new Date(d.setDate(d.getDate() - 3));
		// 	var last = new Date(dEnd.setDate(dEnd.getDate() + 3));
		// 	this.activeYear = last.getFullYear();

		// 	/*			this.weekStartDateString = first.toLocaleDateString();
		// 				this.weekEndDateString = last.toLocaleDateString();*/

		// 	this.weekStartDateString = this.formatDateToString(first);
		// 	this.weekEndDateString = this.formatDateToString(last);

		// 	if (!this._comp.getModel("device").getData().isPhone) {
		// 		this.weekStartDate = d;
		// 		this.weekEndDate = dEnd; //desktop = 1 week	
		// 	} else {
		// 		var dateMobileStart = new Date(sFrom);
		// 		var dateMobileEnd = new Date(sFrom);
		// 		this.weekStartDate = dateMobileStart;
		// 		this.weekEndDate = dateMobileEnd;
		// 		this.weekStartDate.setHours(15, 0, 0, 0);
		// 		this.weekEndDate.setHours(23, 59, 59, 0);
		// 	}

		// 	this.days = [];
		// 	for (var i = 0; i < 7; i++) {
		// 		var temp = new Date(first.getTime());
		// 		temp.setDate(temp.getDate());
		// 		var date = new Date(temp.setDate(temp.getDate() + i));
		// 		if (i == 6) {
		// 			this.days.splice(0, 0, date);
		// 		} else {
		// 			this.days.push(date);
		// 		}
		// 	}
		// 	this.model.setData(this);
		// },
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		getNewDate: function (oEvent, type) {
			// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			// var currMonday = this.weekStartDate;
			// var newDate = new Date(currMonday);
			// newDate.setDate(newDate.getDate() + type);
			// return newDate;
			// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

			// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			// This function will return the previous or next Monday
			var dateMonday = new Date(this.weekStartDate);
			dateMonday.setDate(dateMonday.getDate() + type);
			return dateMonday;
			// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		},

		calcDates: function (oEvent, type, date) {
			var d;

			if (!date) {
				d = this.getNewDate(oEvent, type);
			} else {
				d = date;
			}

			this.setDates(d);

			try {
				var oSource = oEvent.getSource().getParent();
			} catch (err) {
				oSource = oEvent.oSource.oParent;
			}

			if (oSource.getAggregation("items")) {
				var bindingData = oSource.getAggregation("items")[1].getBindingInfo("dateValue").binding.getModel().getData();
				return bindingData;
			}
		},

		adjustData: function (newdata) {
			var dataNew = this._groupByWbs(newdata);
			this.calcTotals(dataNew, true);
			return dataNew;
		},

		adjustTableData: function (newdata) {
			var model = this.getModel("timesheet");
			var aData = model.getData();

			var dataNew = this._groupByWbs(newdata);

			this.calcTotals(dataNew, false);
			aData.TimeSheet = dataNew;

			model.setData(aData);
			//model.refresh(true);
			return dataNew;
		},

		_cleanUpData: function (arr) {
			var newArr = [];
			arr.forEach(function (element, idx) {
				if (element.Status !== "60") {
					//deleted records have got a new counter and Catshours = 0 -> remove them
					if (element.Catshours !== "0.00") {
						newArr.push(element);
					}
				}
			});
			return newArr;
		},

		_getProjectDetails: function (arr) {
			var that = this;
			var data = arr;
			var projects = [];
			var oPromises = [];
			if (!this._comp.getModel("device").getData().isPhone) {
				//desktop
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						var obj = data[key];
						oPromises.push(that._project.lookupProjectName(obj.WbsElement, obj).then(function (bResult) {
							projects.push(obj);
						}));
					}
				}
			} else {
				//phone
				arr.forEach(function (objMobile) {
					oPromises.push(that._project.lookupProjectName(objMobile.WbsElement, objMobile).then(function (bResult) {
						projects.push(bResult);
					}));
				});
			}

			return Promise.all(oPromises).then(function (results) {
				return projects;
			});
		},

		_groupByWbs: function (arr) {
			var that = this;
			var helper = {};
			//	arr.forEach(function (o) {

			for (var j in arr) {
				var o = arr[j];
				var key = o.WbsElement + o.Acttype;

				// var date = new Date(o.Workdate); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
				var date = o.Workdate; // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				// var day = date.getDay().toString();  // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
				var day = date.getUTCDay(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				if (!helper[key]) {
					that._addNewProjectKey(o, helper, key, day, that);
				} else {
					// var keys = Object.keys(helper[key].days); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
					var keys = that._comp._uilogic.getWeekDayKeys(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

					if (helper[key].days[keys[day]].items.length > 0) {
						//need to create a new helper key
						var postfix = "";
						var i = 1;
						do {
							postfix = helper[key].days[keys[day]].items.length + i;
							i++;
						}
						while (helper[key + "_" + i]);
						that._addNewProjectKey(o, helper, key + "_" + postfix, day, that);
					} else {
						helper[key] = that._addHoursToDay(day, o.Workdate, helper[key], o.Catshours, o);
						if (o.Catshours !== "" && o.Catshours !== undefined) {
							helper[key].total += parseFloat(o.Catshours);
						}
					}
				}
			}
			//});

			return helper;
		},

		_addNewProjectKey: function (o, helper, key, day, that) {
			helper[key] = Object.assign({}, o); // create a copy of o
			if (!this._comp.getModel("device").getData().isPhone) {
				helper[key] = that.createDayObjects(helper[key]);
			} else {
				var items = [];
				helper[key].day = {};
				helper[key].day.items = items;
				helper[key].day.total = 0;
			}

			helper[key] = that._addHoursToDay(day, o.Workdate, helper[key], o.Catshours, o);
			helper[key].total = 0;

			if (o.Catshours !== "" && o.Catshours !== undefined) {
				helper[key].total += parseFloat(o.Catshours);
			}
		},

		/*		_deleteProperties: function (data) {
					delete data.Catshours;
					delete data.ChangedBy;
					delete data.Counter;
					delete data.Creationdate;
					delete data.Position;
					delete data.Status;
					delete data.Workdate;
					delete data.AbsAttType;
					return data;
				},
		*/

		createDayObjects: function (data) {
			var items;
			var i = 0;
			data.days = {};

			for (i = 0; i < 7; i++) {
				items = [];

				if (i === 6) {
					data.days.sun = {};
					data.days.sun.items = items;
					data.days.sun.total = 0;
					data.days.sun.date = this.days[i];
				} else if (i === 0) {
					data.days.mon = {};
					data.days.mon.items = items;
					data.days.mon.total = 0;
					data.days.mon.date = this.days[i];
				} else if (i === 1) {
					data.days.tue = {};
					data.days.tue.items = items;
					data.days.tue.total = 0;
					data.days.tue.date = this.days[i];
				} else if (i === 2) {
					data.days.wed = {};
					data.days.wed.items = items;
					data.days.wed.total = 0;
					data.days.wed.date = this.days[i];
				} else if (i === 3) {
					data.days.thu = {};
					data.days.thu.items = items;
					data.days.thu.total = 0;
					data.days.thu.date = this.days[i];
				} else if (i === 4) {
					data.days.fri = {};
					data.days.fri.items = items;
					data.days.fri.total = 0;
					data.days.fri.date = this.days[i];
				} else if (i === 5) {
					data.days.sat = {};
					data.days.sat.items = items;
					data.days.sat.total = 0;
					data.days.sat.date = this.days[i];
				}
			}

			return data;
		},

		_addHoursToDay: function (day, currDate, data, hours, obj) {
			if (!this._comp.getModel("device").getData().isPhone) {
				//desktop
				// var keys = Object.keys(data.days); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
				var keys = this._comp._uilogic.getWeekDayKeys(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				if (data.days[keys[day]] != undefined) {
					data.days[keys[day]].items.push(obj);
					data.days[keys[day]].total = parseFloat(hours) + parseFloat(data.days[keys[day]].total);
				}
			} else {
				//phone
				data.day.items.push(obj);
				data.day.total = parseFloat(hours) + parseFloat(data.day.total);
			}

			return data;
		},

		//desktop
		calcProjectTotal: function (wbs) {
			var that = this;
			var data = this.model.getData().TimeSheet;
			var count = 0;
			var item = data[wbs];
			item.total = 0;
			Object.keys(item.days).forEach(function (key) {
				var currObj = (key, item.days[key]);
				if (currObj.items.length == 0 && currObj.total > 0) {
					currObj.saveStatus = that._comp.appconfig.cats.new;
					count += parseFloat(currObj.total);
				} else {
					if (currObj.total > 0 || currObj.saveStatus === that._comp.appconfig.cats.upd) {
						count += parseFloat(currObj.total);
						if (parseFloat(currObj.items[0].Catshours) !== parseFloat(currObj.total)) {
							currObj.saveStatus = that._comp.appconfig.cats.upd;
						}
					} else if (currObj.total == 0 && currObj.items.length > 0 && currObj.items[0].Catshours !== currObj.total) {
						currObj.saveStatus = that._comp.appconfig.cats.del;
					} else {
						currObj.saveStatus = that._comp.appconfig.cats.empty;
					}
				}
			});

			item.total = count;
			//this.model.refresh();
		},

		calcTotals: function (data, doRefresh) {
			var model = this.getModel("timesheet");
			var aData = model.getData();
			var sumArr = [0, 0, 0, 0, 0, 0, 0, 0];

			for (var thisKey in data) {
				if (data.hasOwnProperty(thisKey)) {
					var item = data[thisKey];
					if (item.visible === true || item.visible === undefined) {
						var idx = 0;

						var oKeys = this._comp._uilogic.getWeekDayKeys(); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

						// Object.keys(item.days).forEach(function (key) { // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
						for (var key in oKeys) { // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
							// var currObj = (key, item.days[key]); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
							var currObj = (oKeys[key], item.days[oKeys[key]]); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
							if (currObj) {
								sumArr[idx] += parseFloat(currObj.total);
								idx++;
							}
						};
					}
				}
			}
			sumArr[7] = sumArr[0] + sumArr[1] + sumArr[2] + sumArr[3] + sumArr[4] + sumArr[5] + sumArr[6];
			aData.weekTotals = sumArr;
			if (doRefresh) {
				this.getModel("timesheet").refresh(); //has to be there
			}
		},

		calcTotalsMobile: function (data) {
			var model = this.getModel("timesheet");
			var aData = model.getData();
			var total = 0;

			data.forEach(function (element, idx) {
				if (element.Catshours && (element.visible || element.visible === undefined)) {
					total += parseFloat(element.Catshours);
				}
			});
			if (total > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			} else {
				aData.dayTotal = total;
				//this.getModel("timesheet").refresh();
				return true;
			}
		},

		callUpdateMobile: function (element, modelCall) {
			var that = this;
			switch (element.saveStatus) {
			case that._comp.appconfig.cats.upd:
				return that.updateTimeSheet(element.saveStatus, modelCall, element.Counter, element.Workdate, element.Employeenumber,
					element.Acttype,
					element
					.WbsElement,
					element.Catshours, element.Position, that);
			case that._comp.appconfig.cats.new:
				if (element.Catshours !== "" && parseFloat(element.Catshours, 10) > 0) {
					return that.updateTimeSheet(element.saveStatus, modelCall, null, element.WorkDate, element.Employeenumber, element.Acttype,
						element.WbsElement,
						element.Catshours, null, that);
				}
				Promise.resolve();
				break;
				//return Promise().resolve();
			case that._comp.appconfig.cats.del:
				return that.updateTimeSheet(element.saveStatus, modelCall, element.Counter, element.Workdate, element.Employeenumber,
					element.Acttype,
					element
					.WbsElement,
					element.Catshours, element.Position, that);
			default:
				//do nothing
				return Promise.resolve("Nothing to update");
				//break;
			}
		},

		callUpdate: function (element, project, modelCall) {
			var that = this;
			if (element.items.length > 0 || element.saveStatus) {
				switch (element.saveStatus) {
				case that._comp.appconfig.cats.upd:
					return that.updateTimeSheet(element.saveStatus, modelCall, element.items[0].Counter, element.items[0].Workdate, element.items[0]
						.Employeenumber,
						element.items[0].Acttype,
						element.items[0]
						.WbsElement,
						element.total, element.items[0].Position, that);
				case that._comp.appconfig.cats.new:
					return that.updateTimeSheet(element.saveStatus, modelCall, null, element.date, project.Employeenumber, project.Acttype, project
						.WbsElement,
						element.total, null, that);
				case that._comp.appconfig.cats.del:
					if (element.items.length > 0) {
						return that.updateTimeSheet(element.saveStatus, modelCall, element.items[0].Counter, element.items[0].Workdate, element.items[
								0]
							.Employeenumber,
							element.items[0].Acttype,
							element.items[0]
							.WbsElement,
							element.total, element.items[0].Position, that);
					} else {
						return Promise.resolve();
					}
				case that._comp.appconfig.cats.empty:
					return Promise.resolve();
				default:
					//do nothing
					return Promise.resolve();
				}
			} else {
				return Promise.resolve();
			}
		},

		saveMobile: function () {
			var that = this;
			var modelCall = that._comp.getModel("SAP");
			modelCall.setUseBatch(that._comp.appconfig.batchCalls); //no batch
			var data = this.getModel().getData().TimeSheet;

			var processArray = function (array, fn) {
				var index = 0;

				return new Promise(function (resolve, reject) {
					function errHandler(exception) {
						reject(exception);
					}

					function next() {
						if (index > 0) {
							array[index - 1].saveStatus = undefined;
						}
						if (index < array.length) {
							that.callUpdateMobile(array[index], modelCall).then(function () {

								if (array[index].saveStatus)
									array[index].saveStatus = "";
								next();

							}, errHandler);
							index++;
							//}
						} else {
							resolve("Done!");
						}
					}
					next();
				});
			};

			return processArray(data);
		},

		save: function () {
			var that = this;
			var modelCall = that._comp.getModel("SAP");
			modelCall.setUseBatch(that._comp.appconfig.batchCalls); //no batch
			var data = this.getModel().getData().TimeSheet;
			that.isDataUpdated = false;

			var processArray = function (array, keys) {
				var index = 0; // for array = data
				var k = 0; // for keys = days
				var element = "";

				return new Promise(function (resolve, reject) {
					function errHandler(exception) {
						reject(exception);
					}

					function next() {

						if (index < keys.length) {
							// var dayKeys = Object.keys(array[keys[index]].days); // day names // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

							// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
							var oKeys = that._comp._uilogic.getWeekDayKeys();
							var dayKeys = Object.keys(oKeys).map(function (key) {
								return [oKeys[key]];
							});
							// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

							if (k < dayKeys.length) { //loop thru the days of the element
								element = array[keys[index]].days[dayKeys[k]];
								// that.callUpdate(element, array[keys[index]], modelCall).then(next, errHandler);

								that.callUpdate(element, array[keys[index]], modelCall).then(function () {

									if (element.saveStatus)
										element.saveStatus = "";
									next();

								}, errHandler);

								k++;
							} else {
								k = 0;
								index++;
								next();
							}
						} else {
							if (that.isDataUpdated) {
								resolve("Done!");
							} else {
								resolve("No changes to the data");
							}
						}
					}
					next();
				});
			};

			var processArrayMobile = function (array) {
				var index = 0;

				return new Promise(function (resolve, reject) {
					function errHandler(exception) {
						reject(exception);
					}

					function next() {
						if (index > 0) {
							array[index - 1].saveStatus = undefined;
						}
						if (index < array.length) {
							if (array[index].saveStatus !== undefined) {
								if (array[index].saveStatus !== that._comp.appconfig.cats.new && array[index].saveStatus !== that._comp.appconfig.cats.empty ||
									(array[index].saveStatus === that._comp.appconfig.cats.new && array[index].Catshours !== "")) { //parseFloat(array[index].Catshours, 10) > 0 )) {
									that.callUpdateMobile(array[index], modelCall).then(next, errHandler);
									index++;
								} else {
									index++;
									next();
								}
							} else {
								index++;
								next();

							}
						} else {
							resolve("Done!");
						}
					}
					next();
				});
			};

			if (this._comp.getModel("device").getData().isPhone) {
				return processArrayMobile(data);
			} else {
				return processArray(data, Object.keys(data)); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
			}
		},

		updateTimeSheet: function (type, oModel, counter, workdate, empnum, acttype, wbs, hours, position, that) {
			var that = this;

			return new Promise(function (resolve, reject) {

				// workdate = that._comp._uilogic.getDateInUTC(workdate); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

				var sPath = oModel.createKey('/TimeSheetSet', {
					Counter: counter,
					Workdate: workdate,
					Employeenumber: empnum
				});

				var obj = {
					Counter: counter,
					Employeenumber: empnum,
					Acttype: acttype,
					WbsElement: wbs,
					Workdate: workdate,
					Catshours: hours,
					Position: position
				};

				var success = function (oData) {
					that.isDataUpdated = true;
					type = "";
					resolve(oData);
				};

				var error = function (oErr) {
					var result = that._comp.getErrorHandler().getMessageType(oErr, that._comp.appconfig.actionSave);
					if (result) {
						that.isDataUpdated = true;
						resolve("Saved");
					} else {
						that.isDataUpdated = false;
						oErr.object = obj;
						reject(oErr);
					}
				};

				//even if the counter is returned in the update call, SAP creates a new record, which means a new counter. 
				//The old one will be assigned status=60, which is not displayed in the Time Sheet.
				if (type === that._comp.appconfig.cats.upd) {
					oModel.update(sPath, obj, {
						success: success,
						error: error
					});
				} else if (type === that._comp.appconfig.cats.del) {
					oModel.remove(sPath, {
						success: success,
						error: error
					});
				} else if (type === that._comp.appconfig.cats.new) {
					var objNew = {
						Acttype: acttype,
						WbsElement: wbs,
						Workdate: workdate,
						Catshours: hours
							//Employeenumber: "12345678"
					};

					oModel.create("/TimeSheetSet", objNew, {
						success: success,
						error: error
					});
				}

			});
		},

		markRowAsDeleted: function (row, data, idx) {
			var that = this;
			Object.keys(row.days).forEach(function (key) {
				var currObj = (key, row.days[key]);
				if (parseFloat(currObj.total) > 0) { //(currObj.items.length > 0) {
					currObj.saveStatus = that._comp.appconfig.cats.del;
				} else if (parseFloat(currObj.total) == 0) {
					currObj.saveStatus = that._comp.appconfig.cats.empty;
				}
			});
			row.visible = false;
		},

		/*		_isFutureDate: function () {
					var week1 = this._comp.getModel("ConfigModel").getData().allowedDays.currWeek;
					
					if(this.activeWeek >= week1) {
						return true;
					}
					return false;
				},
		*/
		/*		_addProjectToTimesheet: function (data, obj, status) {
					if (!this._comp.getModel("device").getData().isPhone) {
						this.createDayObjects(obj);
						if (data) {
							data[obj.WbsElement] = obj;
						} else {
							var temp = [obj];
							this.adjustTableData(temp);
						}
					} else {
						obj.WorkDate = this.weekStartDate;
						obj.saveStatus = status;
						data.push(obj);
					}
				},
		*/
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

		setIsOnlyAbsenceAllowed: function (bool) {
			this.isOnlyAbsenceAllowed = bool;
		},

		getIsOnlyAbsenceAllowed: function () {
			return this.isOnlyAbsenceAllowed;
		},

		clearTimeSheet: function () {
			var model = this.getModel("timesheet");
			var aData = model.getData();
			aData.TimeSheet = null;
			aData.weekTotals = null;

			model.setData(aData);
			//model.refresh(true);
			model.updateBindings(true);
		},

		getWeek: function () {
			return this.activeWeek;
		},

		setWeek: function (week) {
			this.activeWeek = week;
		},

	});
	return TimeSheet;
});