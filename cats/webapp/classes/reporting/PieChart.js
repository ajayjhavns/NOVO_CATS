//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	'com/nn/cats/employee/classes/reporting/ReportingUIElement',
	"sap/ui/model/Filter",
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	'sap/m/MessageBox'
], function (jQuery, ReportingUIElement, Filter, JSONModel, ChartFormatter, Format, MessageBox) {

	var PieChart = ReportingUIElement.extend("com.nn.cats.employee.classes.reporting.PieChart", {
		constructor: function (view, pieId, popOverId, config, component) {

			this._view = view;
			this._comp = component;
			this._id = pieId;
			this._popOverId = popOverId;
			this._config = config;
			this._fieldMappingList = config.fieldMapping;
			this._sortFields = config.sortFields;
			this._group = "";
			this._groupArray = [];

			for (var i in this._fieldMappingList) {
				this._fieldMapping = this._fieldMappingList[i];
				break;
			}

			Format.numericFormatter(ChartFormatter.getInstance());
			var oVizFrame = this.oVizFrame = this._view.byId(pieId);

			oVizFrame.setVizProperties({
				legend: {
					title: {
						visible: false
					}
				},
				title: {
					visible: false,
					text: 'Project Allocation'
				},
				plotArea: {
					dataLabel: {
						visible: true
					}
				}
			});

			var scales = [{
				'feed': 'color',
				'palette': ['#009FDA', '#001965', '#E64A0E', '#82786F', '#AEA79F', '#C7C2BA', '#E0DED8', '#001423', '#3F9C35',
					'#739600', '#C9DD03', '#007C92', '#72B5CC', '#C2DEEA', '#D47600', '#EAAB00'
				]
			}];
			var vizScalesOption = {
				replace: true
			};

			oVizFrame.setVizScales(scales, vizScalesOption);

			var oPopOver = this._view.byId(popOverId);
			oPopOver.connect(oVizFrame.getVizUid());
			oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);

		},

		doAction: function (functionNameText, data) {

			switch (functionNameText) {
			case 'loadAggregDistribution':
				this.loadAggregDistribution(data);
				break;
			default:
			}
		},

		resetGroupLegend: function (group) {
			this._groupArray = [];
		},

		addGroupLegend: function (group) {

			for (var i in this._groupArray) {
				if (this._groupArray[i] === group) {
					return;
				}
			}

			this._groupArray.push(group);
		},

		writeGroupLegend: function () {

			var legendGroup = "";

			for (var i in this._groupArray) {
				var type = this._groupArray[i].substr(0, 1);
				if (type == "D") {
					this._groupArray[i] = this._groupArray[i].replace("DIRECT", "Direct");
				} else if (type == "I") {
					this._groupArray[i] = this._groupArray[i].replace("INDIRECT", "Indirect");
				} else if (type == "O") {
					this._groupArray[i] = this._groupArray[i].replace("OVERHEAD", "Overhead");
				}

				if (legendGroup === "") {
					legendGroup = legendGroup + this._groupArray[i];
				} else {
					if (legendGroup.length > 0 && parseInt(i) <= this._groupArray.length - 1) {
						legendGroup = legendGroup + ", ";
					}
					legendGroup = legendGroup + this._groupArray[i];
				}
			}

			if (this._config.GroupLegend) {
				this._config.GroupLegend.value = legendGroup;

				this.addMoreInfoLinkToGroupLegend();

				if (this._config.GroupLegend.value !== "") {
					this._config.GroupLegend.visible = true;

				} else {
					this._config.GroupLegend.visible = false;

				}
			}
		},

		addMoreInfoLinkToGroupLegend: function () {
			var link = this._comp.getI18ModelText("groupLegendLink", [this._config.moreInfoLink]);
			this._config.GroupLegend.value = this._config.GroupLegend.value + "<p>" + link + "</p>";
		},

		loadAggregDistribution: function (data) {

			var component = this._comp;
			var that = this;
			var dataList = JSON.parse(JSON.stringify(data.results));
			var utilLogic = component.getUtilLogic();

			var setTotalHours = function (totalHours) {
				that._config.TotalHours.value = parseFloat(totalHours).toFixed(2);

				if (totalHours > 0) {
					that._config.TotalHours.visible = true;

				} else {
					that._config.TotalHours.visible = false;
				}
			};

			var elementList = [],
				totalHours = 0;

			this.resetGroupLegend();

			if (this._sortFields)
				dataList = utilLogic.sortByFields(dataList, this._sortFields);

			for (var i in dataList) {

				if (dataList[i][this._fieldMapping.departmentText] == "") {
					continue;
				}

				var group = "";
				var groupAbrev = "";

				if (dataList[i][this._fieldMapping.group]) {
					group = dataList[i][this._fieldMapping.group];
					groupAbrev = dataList[i][this._fieldMapping.group].substr(0, 1);
				}

				totalHours += parseFloat(dataList[i][this._fieldMapping.allocationNumber]);

				var elementIndex = utilLogic.findArrayElementIndexByField(elementList, "departmentId", dataList[i][this._fieldMapping.departmentId]);

				if (elementIndex < 0) {

					var departmentText = dataList[i][this._fieldMapping.departmentText];

					if (group !== "") {
						this.addGroupLegend(groupAbrev + ": " + group);
						departmentText = "[" + groupAbrev + "] " + dataList[i][this._fieldMapping.departmentText];
					}

					var element = {
						departmentId: dataList[i][this._fieldMapping.departmentId],
						departmentText: departmentText,
						type: dataList[i][this._fieldMapping.type],
						allocationNumber: parseFloat(dataList[i][this._fieldMapping.allocationNumber]).toFixed(2)
					};

					elementList.push(element);

				} else {
					elementList[elementIndex].allocationNumber = parseFloat(elementList[elementIndex].allocationNumber) + parseFloat(dataList[i][
						this._fieldMapping.allocationNumber
					]);
					elementList[elementIndex].allocationNumber = parseFloat(elementList[elementIndex].allocationNumber).toFixed(2);
				}
			}

			this.writeGroupLegend();
			setTotalHours(totalHours);
			component.getModels().createCATSPieDistribution(component, this.getModelId(), elementList, totalHours);

			if (elementList.length > 0) {
				this.setVisibility(true);

			} else {
				this.setVisibility(false);

			}
		}
	});

	return PieChart;
});