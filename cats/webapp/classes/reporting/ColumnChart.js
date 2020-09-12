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

	var ColumnChart = ReportingUIElement.extend("com.nn.cats.employee.classes.reporting.ColumnChart", {
		constructor: function (view, barId, popOverId, config, component, title, attachedElementListConfig) {

			this._view = view;
			this._comp = component;
			this._id = barId;
			this._attachedElementListConfig = attachedElementListConfig;
			this._fieldMappingList = config.fieldMapping;
			this._aggregTypeList = config.aggregType;
			this._config = config;
			this._sortFields = config.sortFields;

			for (var i in this._fieldMappingList) {
				this._fieldMapping = this._fieldMappingList[i];
				break;
			}

			for (i in this._aggregTypeList) {
				this._aggregType = this._aggregTypeList[i];
				break;
			}

			Format.numericFormatter(ChartFormatter.getInstance());
			var formatPattern = ChartFormatter.DefaultPattern;

			var oVizFrame = this.oVizFrame = this._view.byId(barId);

			oVizFrame.setVizProperties({
				plotArea: {
					dataLabel: {
						formatString: formatPattern[this._config.proprieties.plotArea],
						visible: true
					}
				},
				valueAxis: {
					label: {
						formatString: formatPattern[this._config.proprieties.valueAxis]
					},
					title: {
						visible: false
					}
				},
				categoryAxis: {
					title: {
						visible: false
					}
				},
				title: {
					visible: false,
					text: title
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
			oPopOver.setFormatString(formatPattern.STANDARDFLOAT);

		},

		doAction: function (functionNameText, data) {

			switch (functionNameText) {
			case 'loadAggregDistribution':
				this.loadAggregDistribution(data);
				break;
			default:
			}
		},

		setAttachedElementListVisibility: function (visible) {

			for (var i in this._attachedElementListConfig) {
				this._attachedElementListConfig[i].visible = visible;
			}
		},

		loadAggregDistribution: function (data) {

			var component = this._comp;
			var utilLogic = component.getUtilLogic();
			var that = this;
			var elementList = [];
			var dataList = data;

			if (this._sortFields)
				dataList.results = utilLogic.sortByFields(dataList.results, this._sortFields);

			switch (this._aggregType) {
			case "Percentage":
				elementList = this.loadAggregPercentageDistribution(dataList);
				break;

			default:
				for (var i in dataList.results) {
					var elementIndex = utilLogic.findArrayElementIndexByField(elementList, "departmentId", data.results[i][this._fieldMapping.departmentId]);

					if (elementIndex < 0) {
						var element = {
							departmentId: dataList.results[i][this._fieldMapping.departmentId],
							departmentText: dataList.results[i][this._fieldMapping.departmentText],
							allocationNumber: parseFloat(dataList.results[i][this._fieldMapping.allocationNumber]).toFixed(2)
						};

						elementList.push(element);

					} else {
						elementList[elementIndex].allocationNumber = parseInt(elementList[elementIndex].allocationNumber) + parseInt(dataList.results[
								i]
							[
								this._fieldMapping.allocationNumber
							]);
						elementList[elementIndex].allocationNumber = parseInt(elementList[elementIndex].allocationNumber);
					}
				}
			}

			component.getModels().createCATSColumnDistribution(component, this.getModelId(), elementList);

			if (elementList.length > 0) {
				that.setVisibility(true);
				that.setAttachedElementListVisibility(true);

			} else {
				that.setVisibility(false);
				that.setAttachedElementListVisibility(false);
			}
		},

		loadAggregPercentageDistribution: function (data) {

			var component = this._comp;
			var utilLogic = component.getUtilLogic();

			var elementList = [];

			for (var i in data.results) {

				var elementIndex = utilLogic.findArrayElementIndexByField(elementList, "departmentId", data.results[i][this._fieldMapping.departmentId]);

				if (elementIndex < 0) {
					var element = {
						departmentId: data.results[i][this._fieldMapping.departmentId],
						departmentText: data.results[i][this._fieldMapping.departmentText],
						allocationNumber: parseFloat(data.results[i][this._fieldMapping.allocationNumber]).toFixed(2),
						records: 1
					};

					elementList.push(element);

				} else {
					elementList[elementIndex].allocationNumber = parseFloat(elementList[elementIndex].allocationNumber) + parseFloat(data.results[i][
						this._fieldMapping.allocationNumber
					]);
					elementList[elementIndex].allocationNumber = parseFloat(elementList[elementIndex].allocationNumber).toFixed(2);
					elementList[elementIndex].records += 1;
				}
			}

			for (i in elementList) {
				elementList[i].allocationNumber = parseFloat((parseFloat(elementList[i].allocationNumber) / elementList[i].records) * 0.01).toFixed(
					2);
			}

			return elementList;
		}

	});

	return ColumnChart;
});