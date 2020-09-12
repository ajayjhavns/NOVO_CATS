//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	'sap/m/MessageBox',
	"sap/ui/model/json/JSONModel",
	"com/nn/cats/employee/model/models",
	"sap/ui/model/Filter",
	"sap/ui/export/Spreadsheet"
], function (jQuery, BaseObject, MessageToast, MessageBox, JSONModel, models, Filter, Spreadsheet) {

	var UtilLogic = BaseObject.extend("com.nn.cats.employee.classes.UtilLogic", {
		constructor: function (comp) {
			this._comp = comp;
		},

		convertFieldToPercentage: function (list, field, totalNumber, coefient) {

			var newList = list;
			var coef = coefient;

			if (!coef) {
				coef = 1;
			}

			for (var i in newList) {
				newList[i][field] = ((parseFloat(newList[i][field]) * 100) / totalNumber) * coef;
			}

			return newList;
		},

		convertFieldWithCoefient: function (list, field, coefient) {

			var newList = list;
			var coef = coefient;

			if (!coef) {
				coef = 1;
			}

			for (var i in newList) {
				newList[i][field] = parseFloat(newList[i][field]) * coef;
			}

			return newList;
		},

		exportToExcel: function (data, columns, fileName) {

			var component = this._comp;
			/*		var oSettings = {
						workbook: {
							columns: columns
						},
						dataSource: data
					};*/

			var oSettings = {
				workbook: {
					columns: columns
				},
				dataSource: data,
				fileName: fileName
			};

			new Spreadsheet(oSettings)
				.build()
				.then(function () {
					var successMessage = component.getI18ModelText("reportingExportExcelSuccess", {});
					MessageToast.show(successMessage);
				});
		},

		dynamicSort: function (property, descending) {
			var sortOrder = 1;

			if (descending) {
				sortOrder = -1;
			}

			if (property[0] === "-") {
				sortOrder = -1;
				property = property.substr(1);
			}
			return function (a, b) {
				var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
				return result * sortOrder;
			};
		},

		sortByField: function (array, field, descending) {
			return array.sort(this.dynamicSort(field, descending));
		},

		sortByFields: function (array, fieldList, descending) {

			var list = array;

			var sortOrder = 1;

			if (descending) {
				sortOrder = -1;
			}

			list.sort(function (element1, element2) {

				for (var i in fieldList) {
					if (element1[fieldList[i]] > element2[fieldList[i]]) return 1 * sortOrder;
					if (element1[fieldList[i]] < element2[fieldList[i]]) return -1 * sortOrder;
				}
			});

			return list;
		},

		convertToDate: function (dateString) {

			var date = dateString.replace('/Date(', '');
			date = date.replace(')/', '');
			date = parseInt(date);
			date = new Date(date);

			return date;
		},

		getWeekDayText: function (date) {
			var weekDay = date.getDay();
			return this._comp.getI18ModelText("weekday" + weekDay);
		},

		getMonthText: function (date) {
			// var monthNumber = date.getMonth() + 1; // Ricardo Quintas (rqu) | 19/08/2019 | Time-Zone month fix
			var monthNumber = date.getUTCMonth() + 1; // Ricardo Quintas (rqu) | 19/08/2019 | Time-Zone month fix
			return this._comp.getI18ModelText("month" + monthNumber);
		},

		getMonthByIndex: function (index) {
			return this._comp.getI18ModelText("month" + index);
		},

		getMonthAbrrByIndex: function (index) {
			return this._comp.getI18ModelText("abbrmonth" + index);
		},

		getMonthQuarter: function (date) {
			var d = date;
			var m = Math.floor(d.getMonth() / 3) + 2;
			var quarterNumber = m > 4 ? m - 4 : m;

			if (quarterNumber > 1) {
				quarterNumber = quarterNumber - 1;

			} else {
				quarterNumber = 4;
			}

			return this._comp.getI18ModelText("quarter" + quarterNumber);
		},

		getQuarterList: function (startDate, endDate) {

			var quarterList = [],
				month = 0,
				currentDate = startDate,
				lastDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

			while (currentDate <= lastDate) {

				var quarterDate = new Date(currentDate.getFullYear(), month, 1);
				var quarter = this.getMonthQuarter(quarterDate);
				quarterList.push(quarter);
				month += 3;
				currentDate = new Date(currentDate.getFullYear(), month, 1);
			}

			return quarterList;
		},

		findArrayElementByField: function (array, field, value) {

			for (var i in array) {

				if (array[i][field] === value) {
					return array[i];
				}
			}
		},

		findArrayElementIndexByField: function (array, field, value) {

			for (var i in array) {

				if (array[i][field] === value) {
					return i;
				}
			}

			return -1;
		},

		findArrayElementIndexByFieldList: function (array, fieldList, keyValue) {

			for (var i in array) {

				var found = true;

				for (var j in fieldList) {

					var field = fieldList[j];
					if (array[i][field] != keyValue[field]) {
						found = false;
						break;
					}
				}

				if (found) {
					return i;
				}
			}

			return -1;
		},

		removeZeroEntriesFromArray: function (array, field) {

			var list = [];

			for (var i in array) {

				if (parseFloat(array[i][field]) > 0) {
					list.push(array[i]);
				}
			}

			return list;
		},

		addPeriodField: function (array, dateField, periodField) {

			var resultList = [];
			for (var i in array) {
				var element = array[i];
				element[periodField] = this.getMonthText(element[dateField]) + " " + element[dateField].getFullYear();
				resultList.push(element);
			}

			return resultList;
		},

		filterArrayByFields: function (array, fieldValueList) {

			var resultArray = [];

			for (var i in array) {
				for (var j in fieldValueList) {

					var fieldValue = fieldValueList[j];
					if (array[i][fieldValue.field] == fieldValue.value) {
						resultArray.push(array[i]);
					}
				}
			}

			return resultArray;
		}
	});

	return UtilLogic;
});