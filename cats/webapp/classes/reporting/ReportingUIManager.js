//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	'sap/m/MessageBox'
], function (jQuery, BaseObject, Filter, JSONModel, ChartFormatter, Format, MessageBox) {

	var ReportingUIManager = BaseObject.extend("com.nn.cats.employee.classes.reporting.ReportingUIManager", {
		constructor: function (id, component) {
			this._id = id;
			this._comp = component;
			this._reportingElementList = [];
		},

		setModel: function (data) {
			var component = this._comp;
			var modelId = this._id + "Model";

			component.getModels().createReportingUIManagerDistribution(component, modelId, data);
		},

		getModel: function () {
			var component = this._comp;
			var modelId = this._id + "Model";

			return component.getModels().getReportingUIManagerDistribution(component, modelId);
		},

		addReportingElement: function (reportingElement) {
			this._reportingElementList.push(reportingElement);
		},

		getReportingElementById: function (id) {
			for (var i in this._reportingElementList) {
				var reportingElement = this._reportingElementList[i];

				if (reportingElement.getId() === id) {
					return reportingElement;
				}
			}
		},

		doActionToAll: function (functionExe, functionNameText) {
			var that = this;

			return new Promise(function (resolve, reject) {

				var success = function (data) {
					that.setModel(data);

					for (var i in that._reportingElementList) {
						var reportingElement = that._reportingElementList[i];
						reportingElement.doAction(functionNameText, data);
					}

					resolve(data);
				};

				functionExe().then(success);
			});
		},

		assignAggregation: function (aggregationNameText) {
			var data = this.getModel().getData();

			for (var i in this._reportingElementList) {
				var reportingElement = this._reportingElementList[i];
				reportingElement.assignAggregation(aggregationNameText, data);
			}
		},

		assignAggregationToElement: function (elementId, aggregationNameText) {

			var data = this.getModel().getData();

			for (var i in this._reportingElementList) {
				var reportingElement = this._reportingElementList[i];

				if (reportingElement.getId() === elementId) {
					reportingElement.assignAggregation(aggregationNameText, data);
				}
			}
		}

	});

	return ReportingUIManager;
});