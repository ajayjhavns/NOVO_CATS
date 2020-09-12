//# sourceURL=PictureUploader.js
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/api/env/Format',
	'sap/m/MessageBox'
], function (jQuery, BaseObject, Filter, JSONModel, Format, MessageBox) {

	var Roles = BaseObject.extend("com.nn.cats.employee.classes.Roles", {
		constructor: function (component) {

			var that = this;

			var getSubOrdinates = function () {
				that.getSubOrdinates();
			};

			this._comp = component;
			this.loadRoles().then(getSubOrdinates);
		},

		loadRoles: function () {
			var component = this._comp;

			return new Promise(function (resolve, reject) {

				var innerSuccess = function (data) {

					var mainControlModel = component.getModels().getMainControl(component);
					var mainControl = mainControlModel.getData();

					for (var i in data.results) {

						switch (data.results[i].Key) {
						case "MANAGER":
							mainControl.userRoles.Manager = true;
							break;

						case "ADMIN":
							mainControl.userRoles.Admin = true;
							break;
						default:
						}
					}

					mainControlModel.refresh();

					component.getTools().hideBusy(0);
					resolve(data);
				};

				var innerFailure = function (data) {
					component.getTools().hideBusy(0);
					reject(data);
				};

				component.getTools().showBusy(0);
				var modelCall = component.getModel("SAP");

				modelCall.setUseBatch(component.appconfig.batchCalls);
				modelCall.read("/RoleSet", {
					success: innerSuccess,
					error: innerFailure
				});
			});

		},

		isManager: function () {

			var component = this._comp;
			var mainControlModel = component.getModels().getMainControl(component);
			var mainControl = mainControlModel.getData();

			return mainControl.userRoles.Manager;
		},

		getSubOrdinates: function () {

			var component = this._comp;
			var mainControlModel = component.getModels().getMainControl(component);
			var mainControl = mainControlModel.getData();

			if (mainControl.userRoles.Manager) {
				return new Promise(function (resolve, reject) {

					var innerSuccess = function (data) {

						component.getModels().createSubordinateList(component, data.results);
						component.getTools().hideBusy(0);
						resolve(data);
					};

					var innerFailure = function (data) {
						component.getTools().hideBusy(0);
						reject(data);
					};

					component.getTools().showBusy(0);
					var modelCall = component.getModel("SAP");

					modelCall.setUseBatch(component.appconfig.batchCalls);
					modelCall.read("/SubOrdinatesSet", {
						success: innerSuccess,
						error: innerFailure
					});
				});

			} else {
				return new Promise.resolve();
			}
		}
	});

	return Roles;
});