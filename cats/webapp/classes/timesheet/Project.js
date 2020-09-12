//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (jQuery, BaseObject, MessageToast, JSONModel) {

	var Project = BaseObject.extend("com.nn.cats.employee.classes.Project", {
		constructor: function (comp) {
			this._comp = comp;
			this._query = "";
			this.model = new JSONModel();
		},

		lookupProjectName: function (wbs, obj) {
			var that = this;

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {

					if (data.results && data.results.length > 0) {
						obj.projectDescription = data.results[0].projectDescription;
						obj.projectNumber = data.results[0].projectNumber;
						obj.wbsDescription = data.results[0].wbsDescription;
						// >>> Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 42
						if (data.results[0].wbsDescription.indexOf("B10") >= 0) {
							obj.wbsDescription = data.results[0].projectDescription;
						}
						// <<< Ricardo Quintas (rqu) | 20/03/2019 | Bug fix: 42
						if (data.results[0].trialId) {
							obj.trialId = "Trial Id: " + data.results[0].trialId;
							obj.isTrial = true;
						} else {
							obj.isTrial = false;
						}
						obj.projectCategory = data.results[0].projectCategory;
						obj.ActName = that._getActTypeInfo(obj);
						if (obj.saveStatus !== that._comp.appconfig.cats.empty && obj.saveStatus !== that._comp.appconfig.cats.del) {
							obj.visible = true;
						}

						resolve(data.results[0]);
					} else {
						return reject(data);
					}
				};
				var innerReject = function (data) {
					if (data.results && data.results.length > 0) {
						reject();
					}
				};
				var filters = [];
				var sFilter = new sap.ui.model.Filter("wbsCode", sap.ui.model.FilterOperator.EQ, wbs);
				filters.push(sFilter);
				if (that._comp.getModel()) {
					that._comp.getModel().read("/ProjectWbss", {
						urlParameters: {},
						success: innerSuccess,
						error: innerReject,
						filters: filters
					});
				} else {

				}
			});
		},

		_getActTypeInfo: function (obj) {
			var model = this._comp.getModel("ActivityTypes");
			if (model) {
				var array = model.getData();
				for (var i = 0; i < array.length; i++) {
					if (array[i].Acttype == obj.Acttype)
						return array[i].Name;
				}
			}
			return "";
		},

		doFuzzySearch: function (evt, action, list) {
			this._query = "";
			if (action !== "CLEAR") {
				this._query = evt.getParameter("query");
				if (this._query !== "") {
					this._query = evt.getParameter("newValue");
				}
			}

			var that = this;

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {
					if (data.results) { // && data.results.length > 0) {

						var utils = that._comp.getUtilLogic();
						var results = utils.filterArrayByFields(data.results, [{
							field: "wbsClosed",
							value: false
						}]);

						results = that.adjustFuzzyResult(results);
						results = utils.sortByFields(results, ["trialId", "wbsDescription"]);

						var model = that._comp.getModels().createModel(results);
						that.model.setData(model.getData());
						//that._comp.setModel(model, "ProjectLookup");
					}
				};

				var filters = [];
				var sFilter = new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.EQ, that._query);
				filters.push(sFilter);
				if (that._comp.getModel()) {
					that._comp.getModel().read("/SearchProjectWbs", {
						urlParameters: {
							"text": "'" + that._query + "'"
						},
						success: innerSuccess,
						error: reject
					});
				} else {}
			});
		},

		getModel: function () {
			return this.model;
		},

		setModel: function (data) {
			this.model.setData(data);
		},

		adjustFuzzyResult: function (fuzzyList) {

			var resultList = [];

			for (var i in fuzzyList) {

				var result = fuzzyList[i];

				if (result.wbsDescription.indexOf("B10") >= 0) {
					result.wbsDescription = result.projectDescription;
				}

				resultList.push(result);
			}

			return resultList;
		}

		/*		doFuzzySearchFilter: function (evt, action, list) {
					var filters = [];
					var query = "";
					if (action !== "CLEAR") {
						var query = evt.getParameter("query");
						if (!query) {
							query = evt.getParameter("newValue");
						}
					}

					if (query && query.length > 0) {
						//var filter = new sap.ui.model.Filter("projectName", sap.ui.model.FilterOperator.Contains, query);
						//filters.push(filter);
						var filter = new sap.ui.model.Filter("projectDescription", sap.ui.model.FilterOperator.Contains, query);
						filters.push(filter);
						filter = new sap.ui.model.Filter("WbsElement", sap.ui.model.FilterOperator.Contains, query);
						filters.push(filter);
						filter = new sap.ui.model.Filter("projectNumber", sap.ui.model.FilterOperator.Contains, query);
						filters.push(filter);

					}

					var filter = new sap.ui.model.Filter({
						filters: filters,
						and: false
					});
					var aFilters = [];
					aFilters.push(filter);

					// update list binding
					var binding = list.getBinding("items");
					binding.filter(aFilters);
				},*/

	});

	return Project;
});