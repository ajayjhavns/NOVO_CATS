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

	var StackedBarChart = ReportingUIElement.extend("com.nn.cats.employee.classes.reporting.StackedBarChart", {
		constructor: function (view, barId, popOverId, radioButtonId, config, searchCriteria, component, title, timeAggreType) {

			this._view = view;
			this._comp = component;
			this._id = barId;
			this._timeAggreType = timeAggreType;
			this._radioButtonId = radioButtonId;
			this._config = config;
			this._fieldMappingList = config.fieldMapping;
			this._searchCriteria = searchCriteria;

			for (var i in this._fieldMappingList) {
				this._fieldMapping = this._fieldMappingList[i];
				break;
			}

			Format.numericFormatter(ChartFormatter.getInstance());
			var formatPattern = ChartFormatter.DefaultPattern;

			this.oVizFrame = this._view.byId(barId);

			this.oVizFrame.setVizProperties({
				plotArea: {
					dataLabel: {
						formatString: formatPattern.STANDARDFLOAT,
						visible: true,
						showTotal: true
					}
				},
				valueAxis: {
					label: {
						formatString: formatPattern.STANDARDFLOAT
					},
					title: {
						visible: false
					}
				},
				valueAxis2: {
					label: {
						formatString: formatPattern.STANDARDFLOAT
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
				'palette': ['#001965', '#009FDA', '#E64A0E', '#82786F', '#AEA79F', '#C7C2BA', '#E0DED8', '#001423', '#3F9C35',
					'#739600', '#C9DD03', '#007C92', '#72B5CC', '#C2DEEA', '#D47600', '#EAAB00'
				]
			}];
			var vizScalesOption = {
				replace: true
			};

			this.oVizFrame.setVizScales(scales, vizScalesOption);

			var oPopOver = this._view.byId(popOverId);
			oPopOver.connect(this.oVizFrame.getVizUid());
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

		assignAggregation: function (aggregationNameText, data) {

			switch (aggregationNameText) {
			case 'reAggregateMonth':
				this._timeAggreType = "Month";
				this.loadAggregDistribution(data);
				break;

			case 'reAggregateQuarter':
				this._timeAggreType = "Quarter";
				this.loadAggregDistribution(data);
				break;

			default:
				ReportingUIElement.prototype.assignAggregation.call(this, aggregationNameText, data); //Super method

			}
		},

		loadAggregDistribution: function (data) {

			var that = this;

			switch (this._timeAggreType) {
			case "Month":
				that.createDistributionMonthly(data);
				break;

			case "Quarter":
				that.createDistributionYearQuarters(data);
				break;

			default:
			}
		},

		createDistributionMonthly: function (data) {

			var elementList = [];
			var component = this._comp;
			var util = component.getUtilLogic();

			for (var i in data.results) {

				var date = data.results[i][this._fieldMapping.PeriodDate];
				var period = util.getMonthText(date) + " " + date.getFullYear();

				var fieldList = ["Period", "Wbs"];
				var keyValue = {
					Period: period,
					Wbs: data.results[i][this._fieldMapping.Wbs]
				};

				var elementIndex = util.findArrayElementIndexByFieldList(elementList, fieldList, keyValue);

				if (elementIndex < 0) {

					var element = {
						PeriodDate: date,
						Period: util.getMonthText(date) + " " + date.getFullYear(),
						Wbs: data.results[i][this._fieldMapping.Wbs],
						allocationNumber: parseFloat(data.results[i][this._fieldMapping.allocationNumber])
					};

					elementList.push(element);
				} else {
					elementList[elementIndex].allocationNumber = elementList[elementIndex].allocationNumber + parseFloat(data.results[i][this._fieldMapping
						.allocationNumber
					]);
				}
			}

			elementList = util.sortByField(elementList, "PeriodDate", false);

			component.getModels().createCATSStackedBarDistribution(component, this.getModelId(), elementList);
		},

		createDistributionYearQuarters: function (data) {

			var elementList = [];
			var component = this._comp;
			var util = component.getUtilLogic();
			var quarterList = util.getQuarterList(this._searchCriteria.startDate, this._searchCriteria.endDate);
			var noAssignmentMsg = this._comp.getI18ModelText("reporting-no-assigment");

			var removeQuarter = function (quarter) {

				for (var i in quarterList) {
					if (quarterList[i] == quarter) {
						quarterList.splice(i, 1);
						break;
					}
				}
			};

			for (var i in data.results) {

				var date = data.results[i][this._fieldMapping.PeriodDate];
				var period = util.getMonthQuarter(date) + " " + date.getFullYear();

				removeQuarter(util.getMonthQuarter(date));

				var fieldList = ["Period", "Wbs"];
				var keyValue = {
					Period: period,
					Wbs: data.results[i][this._fieldMapping.Wbs]
				};

				var elementIndex = util.findArrayElementIndexByFieldList(elementList, fieldList, keyValue);

				if (elementIndex < 0) {

					var element = {
						PeriodDate: date,
						Period: util.getMonthQuarter(date) + " " + date.getFullYear(),
						Wbs: data.results[i][this._fieldMapping.Wbs],
						allocationNumber: parseFloat(data.results[i][this._fieldMapping.allocationNumber])
					};

					elementList.push(element);
				} else {
					elementList[elementIndex].allocationNumber = elementList[elementIndex].allocationNumber + parseFloat(data.results[i][this._fieldMapping
						.allocationNumber
					]);
				}
			}

			if (data.results.length > 0) {
				for (var q in quarterList) {

					element = {
						PeriodDate: "",
						Period: quarterList[q] + " " + date.getFullYear(),
						Wbs: noAssignmentMsg,
						allocationNumber: parseFloat(0)
					};

					elementList.push(element);
				}
			}

			elementList = util.sortByField(elementList, "Period", false);

			component.getModels().createCATSStackedBarDistribution(component, this.getModelId(), elementList);
		},

		selectTimeAggregType: function (TimeAggregType) {
			this.setDataSet(this.getModelId() + TimeAggregType);
			this.setTitle(TimeAggregType);
		},

		setTitle: function (TimeAggregType) {

			var title = this._comp.getI18ModelText("reporting-wbs" + TimeAggregType + "-title");

			this.oVizFrame.setVizProperties({
				title: {
					visible: false,
					text: title
				}
			});
		},

		setDataSet: function (modelId) {

			var component = this._comp;
			var dataModel = component.getModels().getCATSStackedBarDistribution(component, modelId);
			component.getModels().createCATSStackedBarDistribution(component, this.getModelId(), dataModel.getData());
		}

	});

	return StackedBarChart;
});