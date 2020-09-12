sap.ui.define([
	"com/nn/cats/employee/controller/BaseController",
	"com/nn/cats/employee/classes/reporting/ReportingUIManager",
	"com/nn/cats/employee/classes/reporting/BarChart",
	"com/nn/cats/employee/classes/reporting/PieChart",
	"com/nn/cats/employee/classes/reporting/StackedBarChart",
	"com/nn/cats/employee/classes/reporting/ReportingDataTable",
	"com/nn/cats/employee/classes/reporting/ColumnChart",
	"com/nn/cats/employee/util/Formatter",
	"sap/m/MessageToast",
	'sap/m/MessageBox'
], function (BaseController, ReportingUIManager, BarChart, PieChart, StackedBarChart, ReportingDataTable, ColumnChart,
	Formatter, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("com.nn.cats.employee.controller.Reporting", {
		formatter: Formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.nn.cats.employee.view.Reporting
		 */
		onInit: function () {
			var oRouter, oTarget;
			var that = this;

			oRouter = this.getRouter();
			oTarget = oRouter.getTarget("Reporting");
			oTarget.attachDisplay(function (oEvent) {
				this._oData = oEvent.getParameter("data"); // store the data
				that.getOwnerComponent().getTools().hideBusy(0);
			}, this);

			this.getOwnerComponent().loadMonthList();
			this.initYearList();
			this.initReportingValues();
			this.initReportElements();
		},

		initReportElements: function () {
			this.initEmployeeReportElements();
			this.initTeamReportElements();
			this.initComplianceReportElements();
		},

		initEmployeeReportElements: function () {

			var comp = this.getOwnerComponent();
			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();

			this._employeeReportingUIManager = new ReportingUIManager("EmployeeUIManager", comp);

			var barTitle = comp.getI18ModelText("reporting-TopWbs-title");
			var config = reportingControl.BarChart;
			var barChart = new BarChart(this, "EmpDistributionBar", "EmpBarPopOver", config, comp, barTitle, reportingControl.EmpBarRadioButtons);

			config = reportingControl.PieChart;

			if (comp.getRoles().isManager()) {
				config.moreInfoLink = config.moreInfoLinkManager;
			}

			var pieChart = new PieChart(this, "EmpDistributionPie", "EmpPiePopOver", config, comp);

			config = reportingControl.StackedBarChart;
			var stackedBarTitle = comp.getI18ModelText("reporting-wbs-title");
			var stackedBarChart = new StackedBarChart(this, "EmpDistributionStackedBar", "EmpStackedBarPopOver", "EmpBarChartRadioBtn",
				config, reportingControl.searchCriteria, comp, stackedBarTitle, "Month");

			config = reportingControl.ReportTable;
			var configSearchCriteria = reportingControl.searchCriteria;
			var reportingDataTable = new ReportingDataTable(this, "ReportingDataTable", config, configSearchCriteria, comp);

			this._employeeReportingUIManager.addReportingElement(barChart);
			this._employeeReportingUIManager.addReportingElement(pieChart);
			this._employeeReportingUIManager.addReportingElement(stackedBarChart);
			this._employeeReportingUIManager.addReportingElement(reportingDataTable);
		},

		initTeamReportElements: function () {

			var comp = this.getOwnerComponent();
			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();
			var config = {};

			this._teamReportingUIManager = new ReportingUIManager("TeamUIManager", comp);

			config = reportingControl.TeamPieChart;
			var pieChart = new PieChart(this, "TeamDistributionPie", "TeamPiePopOver", config, comp);
			this._teamReportingUIManager.addReportingElement(pieChart);

			config = reportingControl.ReportTeamTable;
			var configSearchCriteria = reportingControl.teamSearchCriteria;
			var reportingDataTable = new ReportingDataTable(this, "ReportingTeamDataTable", config, configSearchCriteria, comp);
			this._teamReportingUIManager.addReportingElement(reportingDataTable);

			config = reportingControl.TeamBarChart;
			var barChart = new BarChart(this, "TeamDistributionBar", "TeamBarPopOver", config, comp, "", reportingControl.TeamBarRadioButtons);
			this._teamReportingUIManager.addReportingElement(barChart);

			config = reportingControl.TeamStackedBarChart;
			var stackedBarChart = new StackedBarChart(this, "TeamDistributionStackedBar", "TeamStackedBarPopOver", "TeamBarChartRadioBtn",
				config, reportingControl.teamSearchCriteria, comp, "", "Month");
			this._teamReportingUIManager.addReportingElement(stackedBarChart);

			config = reportingControl.TeamEmployeeColumn;

			var TeamEmployeeColumn = new ColumnChart(this, "TeamEmployeeColumn", "TeamEmployeeColumnPopOver", config,
				comp,
				"");
			this._teamReportingUIManager.addReportingElement(TeamEmployeeColumn);

		},

		initComplianceReportElements: function () {
			var comp = this.getOwnerComponent();
			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();

			this._complianceReportingUIManager = new ReportingUIManager("ComplianceUIManager", comp);

			var config = reportingControl.ComplianceEmployeeColumn;
			var complianceEmployeeColumn = new ColumnChart(this, "ComplianceEmployeeColumn", "ComplianceEmployeeColumnPopOver", config, comp,
				"");
			this._complianceReportingUIManager.addReportingElement(complianceEmployeeColumn);

			config = reportingControl.ComplianceMonthColumn;
			var complianceMonthColumn = new ColumnChart(this, "ComplianceMonthColumn", "ComplianceMonthColumnPopOver", config, comp,
				"");
			this._complianceReportingUIManager.addReportingElement(complianceMonthColumn);

			config = reportingControl.CompliancePieChart;
			var compliancePieChart = new PieChart(this, "ComplianceDistributionPie", "CompliancePiePopOver", config, comp);
			this._complianceReportingUIManager.addReportingElement(compliancePieChart);

			config = reportingControl.ReportComplianceTable;
			var configSearchCriteria = reportingControl.complianceSearchCriteria;

			var reportingDataTable = new ReportingDataTable(this, "ComplianceReportingDataTable", config, configSearchCriteria, comp);
			this._complianceReportingUIManager.addReportingElement(reportingDataTable);

		},

		initReportingValues: function () {

			var comp = this.getOwnerComponent();
			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();
			var date = new Date();
			date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));

			var startDate = date;
			var endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0));
			reportingControl.searchCriteria.startMonth = startDate.getMonth() + 1;
			reportingControl.searchCriteria.endMonth = endDate.getMonth() + 1;
			reportingControl.searchCriteria.startYear = endDate.getFullYear();
			reportingControl.searchCriteria.endYear = endDate.getFullYear();

			reportingControl.teamSearchCriteria.startMonth = startDate.getMonth() + 1;
			reportingControl.teamSearchCriteria.endMonth = endDate.getMonth() + 1;
			reportingControl.teamSearchCriteria.startYear = endDate.getFullYear();
			reportingControl.teamSearchCriteria.endYear = endDate.getFullYear();

			reportingControl.complianceSearchCriteria.startMonth = startDate.getMonth() + 1;
			reportingControl.complianceSearchCriteria.endMonth = endDate.getMonth() + 1;
			reportingControl.complianceSearchCriteria.startYear = endDate.getFullYear();
			reportingControl.complianceSearchCriteria.endYear = endDate.getFullYear();

			reportingControlModel.refresh();
		},

		initYearList: function () {

			var comp = this.getOwnerComponent();
			var mainControlModel = comp.getModels().getMainControl(comp);
			var mainControl = mainControlModel.getData();
			var years = mainControl.years;
			var date = new Date();
			date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));

			for (var i = 0; i <= 10; i++) {

				var year = {
					id: date.getFullYear() - i,
					text: date.getFullYear() - i
				};

				years.push(year);
			}
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.nn.cats.employee.view.Reporting
		 */
		onBeforeRendering: function () {

		},

		onPressEmployeeQueryButton: function (oEvent) {
			this.loadAggregTimeFrameDistribution();
		},

		loadAggregTimeFrameDistribution: function () {

			var that = this;
			var comp = this.getOwnerComponent();

			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();
			var startMonth = reportingControl.searchCriteria.startMonth;
			var endMonth = reportingControl.searchCriteria.endMonth;
			var year = reportingControl.searchCriteria.year;

			reportingControl.searchCriteria.startDate = new Date(Date.UTC(year, startMonth - 1, 1));
			reportingControl.searchCriteria.endDate = new Date(Date.UTC(year, endMonth, 0));
			reportingControlModel.refresh();

			var loadEmployeeAggregDistribution = function () {
				return that.getOwnerComponent().loadEmployeeAggregDistribution();
			};

			var success = function () {

				that._employeeReportingUIManager.getReportingElementById("EmpDistributionBar").setVisibility(true);
				that._employeeReportingUIManager.getReportingElementById("EmpDistributionStackedBar").setVisibility(false);

				reportingControl.EmployeeScopeSelection.TimeAggreIndex = 0; //Reset bar chart index           
				reportingControlModel.refresh();
			};

			this._employeeReportingUIManager.doActionToAll(loadEmployeeAggregDistribution, 'loadAggregDistribution').then(success);

		},

		onPressTeamQueryButton: function (oEvent) {
			this.loadTeamAggregTimeFrameDistribution();
		},

		loadTeamAggregTimeFrameDistribution: function () {

			var that = this;
			var comp = this.getOwnerComponent();

			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();
			var startMonth = reportingControl.teamSearchCriteria.startMonth;
			var endMonth = reportingControl.teamSearchCriteria.endMonth;
			var year = reportingControl.teamSearchCriteria.year;

			reportingControl.teamSearchCriteria.startDate = new Date(Date.UTC(year, startMonth - 1, 1));
			reportingControl.teamSearchCriteria.endDate = new Date(Date.UTC(year, endMonth, 0));
			reportingControlModel.refresh();

			var loadTeamAggregDistribution = function () {
				return that.getOwnerComponent().loadTeamAggregDistribution();
			};

			var success = function () {

				that._teamReportingUIManager.getReportingElementById("TeamDistributionBar").setVisibility(true);
				that._teamReportingUIManager.getReportingElementById("TeamDistributionStackedBar").setVisibility(false);

				reportingControl.TeamScopeSelection.TimeAggreIndex = 0; //Reset bar chart index           
				reportingControlModel.refresh();
			};

			this._teamReportingUIManager.doActionToAll(loadTeamAggregDistribution, 'loadAggregDistribution').then(success);

		},

		onPressComplianceQueryButton: function (oEvent) {
			this.loadComplianceAggregTimeFrameDistribution();
		},

		loadComplianceAggregTimeFrameDistribution: function () {
			var that = this;
			var comp = this.getOwnerComponent();

			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();
			var startMonth = reportingControl.complianceSearchCriteria.startMonth;
			var endMonth = reportingControl.complianceSearchCriteria.endMonth;
			var year = reportingControl.complianceSearchCriteria.year;

			reportingControl.complianceSearchCriteria.startDate = new Date(Date.UTC(year, startMonth - 1, 1));
			reportingControl.complianceSearchCriteria.endDate = new Date(Date.UTC(year, endMonth, 0));
			reportingControlModel.refresh();

			var loadComplianceAggregDistribution = function () {
				return that.getOwnerComponent().loadComplianceAggregDistribution();
			};

			var loadTotalCompliance = function (data) {

				var totalComplianceData = {
					results: that.loadTotalCompliance(data)
				};

				that._complianceReportingUIManager.getReportingElementById("ComplianceDistributionPie").assignAggregation("Total",
					totalComplianceData);
			};

			this._complianceReportingUIManager.doActionToAll(loadComplianceAggregDistribution, 'loadAggregDistribution').then(
				loadTotalCompliance);
		},

		loadTotalCompliance: function (data) {

			var CpmpliancePct = 0,
				recordNumber = 0,
				complianceList = [];

			for (var i in data.results) {
				CpmpliancePct += parseFloat(data.results[i].CpmpliancePct);
				recordNumber++;
			}

			CpmpliancePct = CpmpliancePct / recordNumber;

			var element = {
				Description: "Compliant",
				CpmpliancePct: parseFloat(CpmpliancePct).toFixed(2)
			};

			complianceList.push(element);

			CpmpliancePct = 100 - CpmpliancePct;

			element = {
				Description: "Non-compliant",
				CpmpliancePct: parseFloat(CpmpliancePct).toFixed(2)
			};

			complianceList.push(element);

			return complianceList;
		},

		onTimeAggreTypeSelected: function (oEvent) {
			if (!oEvent.getParameters().selected) {
				return;
			}
			var datasetRadioId = oEvent.getSource().getId();
			var stackedBarVisible = false;
			var stackedBarChart = this._employeeReportingUIManager.getReportingElementById("EmpDistributionStackedBar");
			var barChart = this._employeeReportingUIManager.getReportingElementById("EmpDistributionBar");

			switch (true) {

			case datasetRadioId.includes("Total"):
				break;

			case datasetRadioId.includes("Month"):
				this._employeeReportingUIManager.assignAggregationToElement("EmpDistributionStackedBar", "reAggregateMonth");
				stackedBarVisible = true;
				break;

			case datasetRadioId.includes("Quarter"):
				this._employeeReportingUIManager.assignAggregationToElement("EmpDistributionStackedBar", "reAggregateQuarter");
				stackedBarVisible = true;
				break;

			default:
			}

			if (stackedBarVisible) {
				stackedBarChart.setVisibility(true);
				barChart.setVisibility(false);

			} else {
				stackedBarChart.setVisibility(false);
				barChart.setVisibility(true);
			}
		},

		onTeamTimeAggreTypeSelected: function (oEvent) {
			if (!oEvent.getParameters().selected) {
				return;
			}
			var datasetRadioId = oEvent.getSource().getId();
			var stackedBarVisible = false;
			var stackedBarChart = this._teamReportingUIManager.getReportingElementById("TeamDistributionStackedBar");
			var barChart = this._teamReportingUIManager.getReportingElementById("TeamDistributionBar");

			switch (true) {

			case datasetRadioId.includes("TTotal"):
				break;

			case datasetRadioId.includes("TMonth"):
				this._teamReportingUIManager.assignAggregationToElement("TeamDistributionStackedBar", "reAggregateMonth");
				stackedBarVisible = true;
				break;

			case datasetRadioId.includes("TQuarter"):
				this._teamReportingUIManager.assignAggregationToElement("TeamDistributionStackedBar", "reAggregateQuarter");
				stackedBarVisible = true;
				break;

			default:
			}

			if (stackedBarVisible) {
				stackedBarChart.setVisibility(true);
				barChart.setVisibility(false);

			} else {
				stackedBarChart.setVisibility(false);
				barChart.setVisibility(true);
			}
		},

		onChangeEmployeeAggreg: function (oEvent) {
			var selectedKey = oEvent.getSource().getSelectedKey();
			this._employeeReportingUIManager.assignAggregation(selectedKey);
		},

		onChangeTeamAggreg: function (oEvent) {
			var selectedKey = oEvent.getSource().getSelectedKey();
			this._teamReportingUIManager.assignAggregation(selectedKey);
		},

		onEmpExportToExcel: function (oEvent) {
			var reportingDataTable = this._employeeReportingUIManager.getReportingElementById("ReportingDataTable");
			reportingDataTable.exportToExcel();
		},

		onEmpPrint: function (oEvent) {
			var reportingDataTable = this._employeeReportingUIManager.getReportingElementById("ReportingDataTable");
			reportingDataTable.printTable();
		},

		onTeamExportToExcel: function (oEvent) {
			var reportingDataTable = this._teamReportingUIManager.getReportingElementById("ReportingTeamDataTable");
			reportingDataTable.exportToExcel();
		},

		onTeamPrint: function (oEvent) {
			var reportingDataTable = this._teamReportingUIManager.getReportingElementById("ReportingTeamDataTable");
			reportingDataTable.printTable();
		},

		onComplianceExportToExcel: function (oEvent) {
			var reportingDataTable = this._complianceReportingUIManager.getReportingElementById("ComplianceReportingDataTable");
			reportingDataTable.exportToExcel();
		},

		onCompliancePrint: function (oEvent) {
			var reportingDataTable = this._complianceReportingUIManager.getReportingElementById("ComplianceReportingDataTable");
			reportingDataTable.printTable();
		},

		onSelectEmployeeToggle: function (oEvent) {

			var comp = this.getOwnerComponent();
			var reportingControlModel = comp.getModels().getReportingControlModel(comp);
			var reportingControl = reportingControlModel.getData();

			if (!reportingControl.searchCriteria.select) {
				reportingControl.searchCriteria.selectedKey = "";
				reportingControl.searchCriteria.selectedId = "";
				reportingControlModel.refresh();
			}
		},

		onNavToSessionList: function (oEvent) {
			this.getRouter().navTo("TargetMain");
		},

		onOpenLink: function (oEvent) {
			var url = this.getOwnerComponent().appconfig.help.reporting;
			window.open(url, "_blank");
		}

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.nn.cats.employee.view.Reporting
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.nn.cats.employee.view.Reporting
		 */
		//	onExit: function() {
		//
		//	}

	});

});