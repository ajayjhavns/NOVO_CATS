//# sourceURL=PictureUploader.js
sap.ui.define([
	"sap/ui/base/Object"
], function (BaseObject) {

	var ReportingUIElement = BaseObject.extend("com.nn.cats.employee.classes.reporting.ReportingUIElement", {
		constructor: function () {
			this._id = "";
			this._fieldMappingList = [];
			this._fieldMapping = {};
			this._config = {};
		},

		getId: function () {
			return this._id;
		},

		getModelId: function () {
			return this._id + "Model";
		},

		assignAggregation: function (aggregationNameText, data) {

			try {
				if (this._fieldMappingList[aggregationNameText]) {
					this._fieldMapping = this._fieldMappingList[aggregationNameText];
					this.loadAggregDistribution(data);
				}
			} catch (err) {
				//Do nothing
			}
		},

		setVisibility: function (visible) {
			this._config.proprieties.visible = visible;
		}

	});

	return ReportingUIElement;
});