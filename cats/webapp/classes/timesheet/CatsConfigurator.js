sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"com/nn/cats/employee/model/models",
	"com/nn/cats/employee/util/Utils"
], function (jQuery, BaseObject, JSONModel, models, Utils) {

	var CatsConfigurator = BaseObject.extend("com.nn.cats.employee.classes.CatsConfigurator", {
		constructor: function (comp) {
			this._comp = comp;
			this.loadActivityTypesSAP();
			//this.loadActivityTypes();
		},

		loadUserProjects: function () {
			var component = this._comp;

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {
					resolve(data);
				};

				var innerFailure = function (data) {
					component.getTools().hideBusy(0);
					reject(data);
				};

				component.getTools().showBusy(0);
				var modelCall = component.getModel();

				modelCall.callFunction("/GetUserProjects", {
					success: innerSuccess,
					error: innerFailure,
				});
			});

		},

		loadActivityTypes: function () {
			var that = this;
			var modelCall = that._comp.getModel();
			modelCall.setUseBatch(false);

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {
					if (data.results && data.results.length > 0) {
						var model = models.createModel(data.results);
						that._comp.setModel(model, "ActivityTypes");
					}
				};
				var innerReject = function (err) {};
				modelCall.read("/ActivityTypes", {
					urlParameters: {},
					success: innerSuccess,
					error: innerReject
				});
			});
		},
		
		loadActivityTypesSAP: function () {
			var that = this;
			var modelCall = that._comp.getModel("SAP");
			modelCall.setUseBatch(false); //no batch

			return new Promise(function (resolve, reject) {
				var innerSuccess = function (data) {
					if (data.results && data.results.length > 0) {
						var model = models.createModel(data.results);
						that._comp.setModel(model, "ActivityTypes");
					}
				};
				var innerReject = function (err) {};
				modelCall.read("/ActivitySet", {
					urlParameters: {
							'sap-language': 'EN'
						},
					success: innerSuccess,
					error: innerReject
				});
			});
		},

		_getProjects: function (data) {
			var projects = [];
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					var proj = data[key];
					if (proj.visible) {

						var obj = {
							wbs: proj.WbsElement,
							projectDescription: proj.projectDescription,
							projectNumber: proj.projectNumber,
							wbsDescription: proj.wbsDescription,
							activityType: proj.Acttype,
							activityName: proj.ActName
						};
						if (proj.trialId) {
							obj.trialId = proj.trialId.substring(10);
						}
						projects.push(obj);
					}
				}
			}

			var userProjects = {};
			userProjects.userProjects = projects;

			return userProjects;
		},

		saveUserProjects: function (projects) {
			var that = this;
			var proj = this._getProjects(projects);

			var modelCall = that._comp.getModel();
			modelCall.setUseBatch(that._comp.appconfig.batchCalls); //no batch
			return new Promise(function (resolve, reject) {
				$.ajax({
					type: "POST",
					cache: false,
					headers: {
						'x-http-method': 'MERGE' /* or PATCH */
					}, //headers: { 'x-http-method': 'PUT' },
					async: false,
					url: "/novo_cat_java_be-0.0.1/UserProjectsUpdate",
					data: new JSONModel(proj).getJSON(),
					contentType: "application/json",
					success: function (data) {
						resolve(data);
					},
					error: function (err) {
						reject(err);
					}
				});
			});
		},

		saveUserProject: function (proj) {
			var that = this;
			var modelCall = that._comp.getModel();
			modelCall.setUseBatch(that._comp.appconfig.batchCalls); //no batch
			return new Promise(function (resolve, reject) {
				var sPath = "/UserProjects";

				var obj = {
					wbs: proj.WbsElement,
					projectDescription: proj.projectDescription,
					projectNumber: proj.projectNumber,
					wbsDescription: proj.wbsDescription,
					activityType: proj.Acttype,
					activityName: proj.ActName,
					trialId: proj.trialId
				};

				var success = function (oData) {
					resolve(oData);
				};

				var error = function (oErr) {
					that._comp.getErrorHandler().showMessage(oErr);
					reject(oErr);
				};

				modelCall.update(sPath, obj, {
					success: success,
					error: error
				});

			});
		}

	});

	return CatsConfigurator;
});