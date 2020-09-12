//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/model/Filter",
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	'sap/m/MessageBox',
	'com/nn/cats/employee/classes/ExportToExcel',
	'com/nn/cats/employee/classes/reporting/ReportingUIElement'
], function (jQuery, Filter, JSONModel, ChartFormatter, Format, MessageBox, ExportToExcel, ReportingUIElement) {

	var ReportingDataTable = ReportingUIElement.extend("com.nn.cats.employee.classes.reporting.ReportingDataTable", {
		constructor: function (view, id, config, searchCriteriaConfig, component) {

			this._view = view;
			this._id = id;
			this._comp = component;
			this._config = config;
			this.searchCriteriaConfig = searchCriteriaConfig;
			this._excelColumns = config.excelColumns;
		},

		loadAggregDistribution: function (data) {

			var component = this._comp;
			var utils = component.getUtilLogic();
			var dataList = utils.sortByFields(data.results, this._config.sortFields);

			if (this._config.totalExcelField) {
				dataList = this.addTotalLine(dataList);
			}

			component.getModels().createCATSTableDistribution(component, this.getModelId(), dataList);

			if (data.results.length > 0) {
				this.setVisibility(true);

			} else {
				this.setVisibility(false);
			}
		},

		addTotalLine: function (data) {

			var EmpList = JSON.parse(JSON.stringify(data));
			var totalHours = 0;
			var totalText = this._comp.getI18ModelText("reporting-table-Total");

			for (var i in data) {
				totalHours = parseFloat(totalHours) + parseFloat(data[i].Catshours);
			}

			totalHours = parseFloat(totalHours).toFixed(2);

			var element = {
				ActivityDescr: "",
				ActivityName: "",
				Catshours: totalHours,
				OrgUnit: "",
				ProjectDescr: "",
				ProjectName: "",
				Unit: "H",
				WbsDescription: "",
				WbsName: ""
			};

			element[this._config.totalExcelField] = totalText;

			EmpList.push(element);

			return EmpList;
		},

		doAction: function (functionNameText, data) {

			switch (functionNameText) {
			case 'loadAggregDistribution':
				this.loadAggregDistribution(data);
				break;
			default:
			}
		},

		printTable: function () {

			var component = this._comp;
			var dataModel = component.getModels().getCATSTableDistributionModel(component, this.getModelId());
			var data = [];
			var title = component.getI18ModelText("reporting-export-excel-employee");

			if (dataModel) {
				data = dataModel.getData();
			}

			if (data.length > 0) {
				var exportExcel = this.buildExcelTable(data, this._id + ".xls");
				exportExcel.printHtml(title);

			} else {
				var errorMessage = component.getI18ModelText("reportingExportExcelNoData");
				MessageBox.error(errorMessage);
			}
		},

		getHtml: function () {

			var htmlTableId = this._view.byId(this._id);
			var htmlTable = jQuery("#" + htmlTableId.getId());

			return htmlTable[0].outerHTML;
		},

		buildExcelTable: function (data, fileName) {

			var component = this._comp;
			var reportingControl = JSON.parse(JSON.stringify(component.getModels().getReportingControlModel(component).getData()));
			var columns = this._excelColumns;
			var exportExcel = new ExportToExcel(fileName);
			exportExcel.addTitle(this.getTableTitle(reportingControl));
			exportExcel.addSubTitle(this.getTimestampTitle());
			exportExcel.startTable();
			exportExcel.addLabels(columns, "label");
			exportExcel.addLines(data, columns, "property");
			exportExcel.endTable();

			return exportExcel;
		},

		exportToExcel: function () {

			var component = this._comp;
			var dataModel = component.getModels().getCATSTableDistributionModel(component, this.getModelId());
			var data = [];

			if (dataModel) {
				data = dataModel.getData();
			}

			if (data && data.length > 0) {

				var exportExcel = this.buildExcelTable(data, this._id + ".xls");

				//Create excel file
				component.getTools().exportExcel(exportExcel.getExcel(), exportExcel.getFileName());

			} else {
				var errorMessage = component.getI18ModelText("reportingExportExcelNoData");
				MessageBox.error(errorMessage);
			}
		},

		getTableTitle: function (reportingControl) {

			var startYear = this.searchCriteriaConfig.startYear;
			var startMonth = this.searchCriteriaConfig.startMonth;
			var startDate = new Date(Date.UTC(startYear, (startMonth - 1), 1));

			var endYear = this.searchCriteriaConfig.endYear;
			var endMonth = this.searchCriteriaConfig.endMonth;
			var endDate = new Date(Date.UTC(endYear, endMonth, 0));

			var title = this._comp.getI18ModelText("reporting-export-excel-employee");
			title += " " + this.dateToString(startDate) + " - " + this.dateToString(endDate);

			return title;
		},

		getTimestampTitle: function () {

			var timeStamp = new Date();
			var title = this._comp.getI18ModelText("reporting-export-excel-timeStamp");

			title += " " + this.timeStampToString(timeStamp);

			return title;
		},

		dateToString: function (date) {

			var dateString = this.pad2(date.getDate()) + "/" + this.pad2(date.getMonth() + 1) + "/" + this.pad2(date.getFullYear());
			return dateString;
		},

		timeStampToString: function (date) {

			var dateTimeStamp = this.dateToString(date);
			dateTimeStamp += " - " + this.pad2(date.getHours()) + ":" + this.pad2(date.getMinutes()) + ":" + this.pad2(date.getSeconds());

			return dateTimeStamp;
		},

		pad2: function (number) {
			return (number < 10 ? '0' : '') + number;
		}

	});

	return ReportingDataTable;
});