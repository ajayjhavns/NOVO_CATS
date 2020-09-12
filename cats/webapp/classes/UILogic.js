//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"com/nn/cats/employee/model/models",
	"sap/ui/model/Filter",
], function (jQuery, BaseObject, JSONModel, models, Filter) {

	var UILogic = BaseObject.extend("com.nn.cats.employee.classes.UILogic", {
		constructor: function (comp) {
			this._comp = comp;
		}
	});

	UILogic.prototype.isNumberFieldValid = function (number) {
		var arr = this._comp.appconfig.hoursSeparator;
		var valid = false;
		var that = this;

		jQuery.each(arr, function (i, sep) {
			//	var sep = n;
			valid = that.isValid(sep, number);
			if (valid) {
				return false;
			}
		});

		return valid;

	};

	UILogic.prototype.isValid = function (sep, number) {
		var noDec = number.replace(sep, ""); //Remove .
		var isNum = /^\d+$/.test(noDec); // test for numbers only and return true or false
		if (isNum) {
			var retVal = false;
			var n = number.length - noDec.length;
			switch (n) {
			case 0: //no decimal
				if (number.length <= 2 && parseInt(number) <= 24) { //the number can only be 2 digits
					retVal = true;
				}
				break;
			case 1: //only one decimal
				if (!number.startsWith(sep)) { //the decimal can't be the first character
					retVal = true;
				}
				break;
			default:
				retVal = false;
			}
			return retVal;
		} else {
			return false;
		}

	};

	UILogic.prototype.isWeekValid = function (date) {
		var configModel = this._comp.getModel("ConfigModel").getData();
		var dateTemp;

		// >>> Ricardo Quintas (rqu) | 19/11/2019 | Bug fix: Time-Zone Issue
		// Here we're making sure the dateTemp is always starting on a Monday (so that dateTemp.getDay() === 1)
		var iDayOfWeek = date.getDay();
		date.setDate(date.getDate() + (1 - iDayOfWeek));
		dateTemp = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
		// <<< Ricardo Quintas (rqu) | 19/11/2019 | Bug fix: Time-Zone Issue	

		var weekSelected = this.getWeekNo(dateTemp); // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		// var weekSelected = this.getWeekNo(date); //Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);  // Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		return this.isInArray(weekSelected, configModel.allowedDays.valid);
		//return configModel.allowedDays.firstWeek <= weekSelected && weekSelected <= configModel.allowedDays.lastWeek;
	};

	/*UILogic.prototype.isWeekNoValid = function (date, number) {
		var configModel = this._comp.getModel("ConfigModel").getData();
		if (number >= 0) {
			if (configModel.allowedDays.forward >= number) {
				return true;
			} else {
				return false;
			}
		} else {
			if (-configModel.allowedDays.back <= number) {
				return true;
			} else {
				return false;
			}
		}
	};*/

	UILogic.prototype.isInArray = function (value, array) {
		return array.indexOf(value) > -1;
	};

	UILogic.prototype.getWeekNo = function (date) {
		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		// //var date = new Date(this.getTime());  // <-- this line was commented out, so the code whas changing the argument date. THIS IS WRONG!!!  rqu
		// date.setHours(0, 0, 0, 0);
		// // Thursday in current week decides the year.
		// date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
		// // January 4 is always in week 1.
		// var week1 = new Date(date.getFullYear(), 0, 4);
		// // Adjust to Thursday in week 1 and count number of weeks from date to week1.
		// return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

		// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
		var newDate = new Date(date);
		newDate.setHours(0, 0, 0, 0);

		// Thursday in current week decides the year.
		newDate.setDate(newDate.getDate() + 3 - (newDate.getDay() + 6) % 7);

		// January 4 is always in week 1.
		var week1 = new Date(newDate.getFullYear(), 0, 4);

		// Adjust to Thursday in week 1 and count number of weeks from date to week1.
		return 1 + Math.round(((newDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
		// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
	};

	UILogic.prototype.isMaxHoursValid = function (id, value, totalArr) {
		if (id.includes("mon")) {
			//if (totalArr[1] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[1] >= this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("tue")) {
			//if (totalArr[2] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[2] >= this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("wed")) {
			//if (totalArr[3] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[3] > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("thu")) {
			//if (totalArr[4] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[4] > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("fri")) {
			//if (totalArr[5] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[5] > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("sat")) {
			//if (totalArr[6] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[6] > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		} else if (id.includes("sun")) {
			//if (totalArr[0] + parseInt(value, 10) > this._comp.appconfig.timeSheetConfig.maxHours) {
			if (totalArr[0] > this._comp.appconfig.timeSheetConfig.maxHours) {
				return false;
			}
		}

		return true;
	};

	// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
	UILogic.prototype.getWeekDayKeys = function () {
		var oKeys = {
			0: "sun",
			1: "mon",
			2: "tue",
			3: "wed",
			4: "thu",
			5: "fri",
			6: "sat"
		};
		return oKeys;
	};
	// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

	// >>> Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue
	UILogic.prototype.getDateInUTC = function (oDate, sType) {
		var iUTC;
		iUTC = Date.UTC(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 0, 0, 0);

		// if (sType === "end") {
		// 	iUTC = Date.UTC(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 23, 59, 59);
		// }

		var utcDate = new Date(iUTC);
		return utcDate;
	};
	// <<< Ricardo Quintas (rqu) | 08/04/2019 | Bug fix: 46 Time-Zone Issue

	UILogic.prototype.getTimeZoneDate = function (date, type, isPhone) {
		if (isPhone) {
			var UTCDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
			if (type === "start") {
				UTCDate.setHours(0, 0, 0, 0);
			} else if (type === "end") {
				UTCDate.setHours(23, 59, 59, 999);
			}
			date = UTCDate;
		}
		var offset = date.getTimezoneOffset() / 60;
		date.setHours(date.getHours() - offset);
		return date;
	};

	UILogic.prototype.getDay = function (workDate, num) {
		var curr = new Date(Date.UTC(workDate.getFullYear(), workDate.getMonth(), workDate.getDate()));
		var currT = new Date(curr.getTime());
		return new Date(currT.setDate(currT.getDate() + num));
	};

	return UILogic;
});